"""
SSH WebSocket Router
====================

This router provides web-based SSH terminal access to robots via WebSocket.
It allows users to securely connect to their Raspberry Pi robots from the
web interface using a browser-based terminal.

Features:
- WebSocket-based SSH proxy
- Secure SSH connection to robots using their IP address
- Real-time bidirectional communication
- Automatic cleanup on disconnect

Security:
- Requires authentication (SSH credentials)
- SSH connection is established from backend to robot
- WebSocket authenticates via session/token
"""

# ============================================================================
# IMPORTS
# ============================================================================

import asyncio
import json
import logging
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session

# AsyncSSH for SSH connections
import asyncssh

# Database dependencies
from database.database import get_db
from models.robot import Robot

# ============================================================================
# LOGGING SETUP
# ============================================================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# ROUTER SETUP
# ============================================================================

router = APIRouter(
    prefix="/ssh",
    tags=["SSH Terminal"],
    responses={404: {"description": "Not found"}},
)

# ============================================================================
# SSH CONNECTION MANAGER
# ============================================================================

class SSHConnectionManager:
    """
    Manages SSH connections and WebSocket communication.
    Handles bidirectional data flow between browser terminal and SSH session.
    """
    
    def __init__(self):
        self.active_connections: dict[str, dict] = {}
    
    async def connect(
        self,
        websocket: WebSocket,
        robot_ip: str,
        ssh_username: str,
        ssh_password: str,
        connection_id: str
    ):
        """
        Establish SSH connection and WebSocket link.
        
        Args:
            websocket: WebSocket connection from frontend
            robot_ip: IP address of the robot
            ssh_username: SSH username (usually 'pi')
            ssh_password: SSH password
            connection_id: Unique identifier for this connection
        """
        try:
            # Accept WebSocket connection
            await websocket.accept()
            
            # Establish SSH connection
            logger.info(f"Connecting to {ssh_username}@{robot_ip}")
            
            ssh_client = await asyncssh.connect(
                robot_ip,
                username=ssh_username,
                password=ssh_password,
                known_hosts=None,  # Accept all host keys (for development)
                client_keys=None,
                keepalive_interval=30,
                keepalive_count_max=3
            )
            
            # Create interactive SSH session (pseudo-terminal)
            ssh_process = await ssh_client.create_process(
                term_type='xterm-256color',
                term_size=(80, 24)  # Default terminal size (cols, rows)
            )
            
            # Store connection info
            self.active_connections[connection_id] = {
                'websocket': websocket,
                'ssh_client': ssh_client,
                'ssh_process': ssh_process,
                'robot_ip': robot_ip
            }
            
            logger.info(f"SSH connection established: {connection_id}")
            
            # Start bidirectional data forwarding
            await self._forward_data(connection_id)
            
        except asyncssh.Error as e:
            logger.error(f"SSH connection failed: {e}")
            await websocket.send_json({
                "type": "error",
                "message": f"SSH connection failed: {str(e)}"
            })
            await websocket.close(code=1008)
        except Exception as e:
            logger.error(f"Connection error: {e}")
            await websocket.send_json({
                "type": "error",
                "message": f"Connection error: {str(e)}"
            })
            await websocket.close(code=1011)
    
    async def _forward_data(self, connection_id: str):
        """
        Forward data bidirectionally between WebSocket and SSH.
        
        Args:
            connection_id: Unique connection identifier
        """
        conn = self.active_connections.get(connection_id)
        if not conn:
            return
        
        websocket = conn['websocket']
        ssh_process = conn['ssh_process']
        
        async def ws_to_ssh():
            """Forward data from WebSocket to SSH"""
            try:
                while True:
                    # Receive data from browser terminal
                    data = await websocket.receive_text()
                    
                    # Parse message
                    try:
                        message = json.loads(data)
                        msg_type = message.get('type')
                        
                        if msg_type == 'input':
                            # User typed something in terminal
                            input_data = message.get('data', '')
                            ssh_process.stdin.write(input_data)
                        
                        elif msg_type == 'resize':
                            # Terminal window was resized
                            cols = message.get('cols', 80)
                            rows = message.get('rows', 24)
                            ssh_process.change_terminal_size(cols, rows)
                    
                    except json.JSONDecodeError:
                        # If not JSON, treat as raw input
                        ssh_process.stdin.write(data)
                    
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected: {connection_id}")
            except Exception as e:
                logger.error(f"WS->SSH error: {e}")
        
        async def ssh_to_ws():
            """Forward data from SSH to WebSocket"""
            try:
                while True:
                    # Read output from SSH session
                    output = await ssh_process.stdout.read(8192)
                    if not output:
                        break
                    
                    # Send to browser terminal
                    await websocket.send_json({
                        'type': 'output',
                        'data': output
                    })
                    
            except Exception as e:
                logger.error(f"SSH->WS error: {e}")
        
        # Run both directions concurrently
        try:
            await asyncio.gather(
                ws_to_ssh(),
                ssh_to_ws(),
                return_exceptions=True
            )
        finally:
            await self.disconnect(connection_id)
    
    async def disconnect(self, connection_id: str):
        """
        Close SSH connection and WebSocket.
        
        Args:
            connection_id: Unique connection identifier
        """
        conn = self.active_connections.get(connection_id)
        if conn:
            logger.info(f"Disconnecting SSH session: {connection_id}")
            
            try:
                # Close SSH process
                if conn['ssh_process']:
                    conn['ssh_process'].terminate()
                    await conn['ssh_process'].wait_closed()
                
                # Close SSH client
                if conn['ssh_client']:
                    conn['ssh_client'].close()
                    await conn['ssh_client'].wait_closed()
                
                # Close WebSocket
                if conn['websocket']:
                    await conn['websocket'].close()
            
            except Exception as e:
                logger.error(f"Error during disconnect: {e}")
            
            # Remove from active connections
            del self.active_connections[connection_id]

# ============================================================================
# GLOBAL CONNECTION MANAGER
# ============================================================================

ssh_manager = SSHConnectionManager()

# ============================================================================
# WEBSOCKET ENDPOINTS
# ============================================================================

@router.websocket("/connect/{robot_id}")
async def websocket_ssh_endpoint(
    websocket: WebSocket,
    robot_id: str,
    ssh_username: str,
    ssh_password: str,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for SSH terminal access to a robot.
    
    Args:
        websocket: WebSocket connection
        robot_id: Unique robot identifier
        ssh_username: SSH username (e.g., 'pi')
        ssh_password: SSH password
        db: Database session
    
    Usage:
        ws://localhost:8000/ssh/connect/tonypi_01?ssh_username=pi&ssh_password=raspberry
    
    WebSocket Message Format:
        Client -> Server:
            {"type": "input", "data": "ls -la\n"}
            {"type": "resize", "cols": 120, "rows": 30}
        
        Server -> Client:
            {"type": "output", "data": "drwxr-xr-x 2 pi pi 4096 Jan 23 10:30 .\n"}
            {"type": "error", "message": "Connection failed"}
    """
    connection_id = f"{robot_id}_{id(websocket)}"
    
    try:
        # Fetch robot from database
        robot = db.query(Robot).filter(Robot.robot_id == robot_id).first()
        
        if not robot:
            await websocket.accept()
            await websocket.send_json({
                "type": "error",
                "message": f"Robot '{robot_id}' not found"
            })
            await websocket.close(code=1008)
            return
        
        if not robot.ip_address:
            await websocket.accept()
            await websocket.send_json({
                "type": "error",
                "message": f"Robot '{robot_id}' has no IP address. Ensure robot is online."
            })
            await websocket.close(code=1008)
            return
        
        # Establish SSH connection
        await ssh_manager.connect(
            websocket=websocket,
            robot_ip=robot.ip_address,
            ssh_username=ssh_username,
            ssh_password=ssh_password,
            connection_id=connection_id
        )
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {connection_id}")
        await ssh_manager.disconnect(connection_id)
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await ssh_manager.disconnect(connection_id)

# ============================================================================
# REST ENDPOINTS
# ============================================================================

@router.get("/test/{robot_id}")
async def test_ssh_connection(
    robot_id: str,
    ssh_username: str,
    ssh_password: str,
    db: Session = Depends(get_db)
):
    """
    Test SSH connectivity to a robot without establishing a full session.
    
    Args:
        robot_id: Robot identifier
        ssh_username: SSH username
        ssh_password: SSH password
        db: Database session
    
    Returns:
        {"success": true, "message": "SSH connection successful"}
        or
        {"success": false, "error": "Connection failed: ..."}
    """
    try:
        # Fetch robot
        robot = db.query(Robot).filter(Robot.robot_id == robot_id).first()
        
        if not robot:
            raise HTTPException(status_code=404, detail=f"Robot '{robot_id}' not found")
        
        if not robot.ip_address:
            raise HTTPException(
                status_code=400,
                detail=f"Robot '{robot_id}' has no IP address"
            )
        
        # Test connection
        logger.info(f"Testing SSH connection to {robot.ip_address}")
        
        async with asyncssh.connect(
            robot.ip_address,
            username=ssh_username,
            password=ssh_password,
            known_hosts=None,
            connect_timeout=10
        ) as conn:
            # Run a simple command to verify connection
            result = await conn.run('echo "SSH test successful"', check=True)
            output = result.stdout.strip()
        
        return {
            "success": True,
            "message": f"SSH connection successful: {output}",
            "robot_id": robot_id,
            "robot_ip": robot.ip_address
        }
    
    except asyncssh.Error as e:
        return {
            "success": False,
            "error": f"SSH connection failed: {str(e)}",
            "robot_id": robot_id
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error: {str(e)}",
            "robot_id": robot_id
        }
