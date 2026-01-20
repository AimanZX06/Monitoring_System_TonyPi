# System Usability Scale (SUS) Questionnaire
## TonyPi Robot Monitoring System

---

## Table of Contents

1. [About SUS](#about-sus)
2. [When to Conduct SUS](#when-to-conduct-sus)
3. [SUS Questionnaire](#sus-questionnaire)
4. [Response Collection Forms](#response-collection-forms)
5. [Scoring Guide](#scoring-guide)
6. [Results Interpretation](#results-interpretation)
7. [SUS Results Report Template](#sus-results-report-template)

---

## About SUS

The **System Usability Scale (SUS)** is a reliable, industry-standard tool for measuring the usability of a system. Created by John Brooke in 1986, it provides a quick and effective way to assess how users perceive the usability of your application.

### Key Facts

| Aspect | Detail |
|--------|--------|
| **Questions** | 10 standardized questions |
| **Scale** | 1 (Strongly Disagree) to 5 (Strongly Agree) |
| **Time** | 2-3 minutes to complete |
| **Score Range** | 0-100 |
| **Average Score** | 68 (industry benchmark) |
| **Minimum Respondents** | 5+ recommended for reliability |

### Why Use SUS?

- **Standardized** - Allows comparison across different systems
- **Quick** - Only 10 questions, easy for users to complete
- **Reliable** - Proven validity over 35+ years of use
- **Versatile** - Works for any interactive system

---

## When to Conduct SUS

### Recommended Timing

```
┌─────────────────────────────────────────────────────────────────┐
│                      PROJECT TIMELINE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Development ──► Unit Tests ──► UAT ──► SUS Survey ──► Go-Live  │
│                                          ▲                       │
│                                          │                       │
│                                    [YOU ARE HERE]                │
│                                                                  │
│  Conduct SUS after users have:                                   │
│  • Completed UAT test scenarios                                  │
│  • Used the system for at least 15-30 minutes                   │
│  • Experienced the core features                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Participants

| Persona | Role | Min. Respondents |
|---------|------|------------------|
| Admin (Ahmad) | System Administrator | 1-2 |
| Operator (Nurul) | Robot Operator | 2-3 |
| Viewer (Dr. Tan) | Research Viewer | 1-2 |
| Technician (Hafiz) | Maintenance Technician | 1-2 |
| **Total** | | **5-9** |

---

## SUS Questionnaire

### Instructions for Respondents

> Please rate your agreement with each statement based on your experience using the **TonyPi Robot Monitoring System**. 
>
> Select a number from 1 to 5 where:
> - **1** = Strongly Disagree
> - **2** = Disagree
> - **3** = Neutral
> - **4** = Agree
> - **5** = Strongly Agree
>
> Please respond to all questions based on your first impression. Don't overthink your answers.

---

### The 10 SUS Questions

| # | Statement | 1 | 2 | 3 | 4 | 5 |
|---|-----------|---|---|---|---|---|
| **Q1** | I think that I would like to use the TonyPi Monitoring System frequently. | ○ | ○ | ○ | ○ | ○ |
| **Q2** | I found the TonyPi Monitoring System unnecessarily complex. | ○ | ○ | ○ | ○ | ○ |
| **Q3** | I thought the TonyPi Monitoring System was easy to use. | ○ | ○ | ○ | ○ | ○ |
| **Q4** | I think that I would need the support of a technical person to be able to use this system. | ○ | ○ | ○ | ○ | ○ |
| **Q5** | I found the various functions in the TonyPi Monitoring System were well integrated. | ○ | ○ | ○ | ○ | ○ |
| **Q6** | I thought there was too much inconsistency in the TonyPi Monitoring System. | ○ | ○ | ○ | ○ | ○ |
| **Q7** | I would imagine that most people would learn to use the TonyPi Monitoring System very quickly. | ○ | ○ | ○ | ○ | ○ |
| **Q8** | I found the TonyPi Monitoring System very cumbersome to use. | ○ | ○ | ○ | ○ | ○ |
| **Q9** | I felt very confident using the TonyPi Monitoring System. | ○ | ○ | ○ | ○ | ○ |
| **Q10** | I needed to learn a lot of things before I could get going with the TonyPi Monitoring System. | ○ | ○ | ○ | ○ | ○ |

---

## Response Collection Forms

### Individual Response Form

Copy this form for each respondent:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    SUS RESPONSE FORM - INDIVIDUAL                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Respondent ID:     _______________                                          ║
║  Role/Persona:      ☐ Admin  ☐ Operator  ☐ Viewer  ☐ Technician             ║
║  Date:              _______________                                          ║
║  Time Spent Using System: ___ minutes                                        ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree)        ║
║                                                                               ║
║  Q1:  I would like to use this system frequently.              [ ___ ]       ║
║                                                                               ║
║  Q2:  I found the system unnecessarily complex.                [ ___ ]       ║
║                                                                               ║
║  Q3:  I thought the system was easy to use.                    [ ___ ]       ║
║                                                                               ║
║  Q4:  I would need technical support to use this system.       [ ___ ]       ║
║                                                                               ║
║  Q5:  The functions were well integrated.                      [ ___ ]       ║
║                                                                               ║
║  Q6:  There was too much inconsistency in the system.          [ ___ ]       ║
║                                                                               ║
║  Q7:  Most people would learn to use this quickly.             [ ___ ]       ║
║                                                                               ║
║  Q8:  I found the system very cumbersome to use.               [ ___ ]       ║
║                                                                               ║
║  Q9:  I felt very confident using the system.                  [ ___ ]       ║
║                                                                               ║
║  Q10: I needed to learn a lot before using this system.        [ ___ ]       ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  OPTIONAL FEEDBACK:                                                           ║
║                                                                               ║
║  What did you like most about the system?                                    ║
║  _________________________________________________________________________   ║
║  _________________________________________________________________________   ║
║                                                                               ║
║  What would you improve?                                                     ║
║  _________________________________________________________________________   ║
║  _________________________________________________________________________   ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

### Consolidated Response Table

Use this table to collect all responses:

| Respondent | Role | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | SUS Score |
|------------|------|----|----|----|----|----|----|----|----|----|----|-----------|
| R1 | Admin | | | | | | | | | | | |
| R2 | Operator | | | | | | | | | | | |
| R3 | Operator | | | | | | | | | | | |
| R4 | Viewer | | | | | | | | | | | |
| R5 | Technician | | | | | | | | | | | |
| R6 | | | | | | | | | | | | |
| R7 | | | | | | | | | | | | |
| **Average** | | | | | | | | | | | | **___** |

---

## Scoring Guide

### Step-by-Step Calculation

The SUS score is calculated using a specific formula. **Note:** Odd and even questions are scored differently!

#### Step 1: Score Odd Questions (Q1, Q3, Q5, Q7, Q9)

For questions 1, 3, 5, 7, and 9:
```
Contribution = (Response Value) - 1
```

| Response | Calculation | Contribution |
|----------|-------------|--------------|
| 1 | 1 - 1 | 0 |
| 2 | 2 - 1 | 1 |
| 3 | 3 - 1 | 2 |
| 4 | 4 - 1 | 3 |
| 5 | 5 - 1 | 4 |

#### Step 2: Score Even Questions (Q2, Q4, Q6, Q8, Q10)

For questions 2, 4, 6, 8, and 10:
```
Contribution = 5 - (Response Value)
```

| Response | Calculation | Contribution |
|----------|-------------|--------------|
| 1 | 5 - 1 | 4 |
| 2 | 5 - 2 | 3 |
| 3 | 5 - 3 | 2 |
| 4 | 5 - 4 | 1 |
| 5 | 5 - 5 | 0 |

#### Step 3: Calculate Total and Final Score

```
Total Contribution = Sum of all 10 contributions (range: 0-40)
SUS Score = Total Contribution × 2.5 (range: 0-100)
```

---

### Calculation Worksheet

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    SUS SCORE CALCULATION WORKSHEET                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Respondent: _______________                                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  ODD QUESTIONS (subtract 1 from response):                                   ║
║  ─────────────────────────────────────────                                   ║
║  Q1: Response [___] - 1 = Contribution [___]                                 ║
║  Q3: Response [___] - 1 = Contribution [___]                                 ║
║  Q5: Response [___] - 1 = Contribution [___]                                 ║
║  Q7: Response [___] - 1 = Contribution [___]                                 ║
║  Q9: Response [___] - 1 = Contribution [___]                                 ║
║                                                                               ║
║  Odd Questions Subtotal: [___]                                               ║
║                                                                               ║
║  EVEN QUESTIONS (subtract response from 5):                                  ║
║  ──────────────────────────────────────────                                  ║
║  Q2:  5 - Response [___] = Contribution [___]                                ║
║  Q4:  5 - Response [___] = Contribution [___]                                ║
║  Q6:  5 - Response [___] = Contribution [___]                                ║
║  Q8:  5 - Response [___] = Contribution [___]                                ║
║  Q10: 5 - Response [___] = Contribution [___]                                ║
║                                                                               ║
║  Even Questions Subtotal: [___]                                              ║
║                                                                               ║
║  ═══════════════════════════════════════════════════════════════════════════ ║
║                                                                               ║
║  TOTAL CONTRIBUTION: [___] + [___] = [___]                                   ║
║                       (odd)   (even)                                         ║
║                                                                               ║
║  SUS SCORE: [___] × 2.5 = [_______]                                          ║
║              (total)                                                          ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

### Example Calculation

**Sample Responses:**

| Question | Response | Type | Calculation | Contribution |
|----------|----------|------|-------------|--------------|
| Q1 | 4 | Odd | 4 - 1 | 3 |
| Q2 | 2 | Even | 5 - 2 | 3 |
| Q3 | 5 | Odd | 5 - 1 | 4 |
| Q4 | 1 | Even | 5 - 1 | 4 |
| Q5 | 4 | Odd | 4 - 1 | 3 |
| Q6 | 2 | Even | 5 - 2 | 3 |
| Q7 | 4 | Odd | 4 - 1 | 3 |
| Q8 | 1 | Even | 5 - 1 | 4 |
| Q9 | 5 | Odd | 5 - 1 | 4 |
| Q10 | 2 | Even | 5 - 2 | 3 |
| **Total** | | | | **34** |

**SUS Score = 34 × 2.5 = 85**

---

## Results Interpretation

### Score Ranges

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUS SCORE INTERPRETATION                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Score      Grade    Adjective      Percentile    Acceptability             │
│  ─────────────────────────────────────────────────────────────              │
│                                                                              │
│  84.1-100    A+      Best Imaginable   96-100%    ████████████ Excellent    │
│  80.8-84.0   A       Excellent         90-95%     ███████████░              │
│  78.9-80.7   A-                        85-89%     ██████████░░              │
│  ─────────────────────────────────────────────────────────────              │
│  77.2-78.8   B+                        80-84%     █████████░░░              │
│  74.1-77.1   B       Good              70-79%     ████████░░░░ Acceptable   │
│  72.6-74.0   B-                        65-69%     ███████░░░░░              │
│  ─────────────────────────────────────────────────────────────              │
│  71.1-72.5   C+                        60-64%     ██████░░░░░░              │
│  65.0-71.0   C       OK                41-59%     █████░░░░░░░              │
│  62.7-64.9   C-                        35-40%     ████░░░░░░░░              │
│  ─────────────────────────────────────────────────────────────              │
│  51.7-62.6   D       Poor              15-34%     ███░░░░░░░░░ Marginal     │
│  ─────────────────────────────────────────────────────────────              │
│  0.0-51.6    F       Worst Imaginable  0-14%      █░░░░░░░░░░░ Unacceptable │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│  INDUSTRY AVERAGE: 68                                                        │
│  TARGET FOR TONYPI SYSTEM: 70+ (Acceptable) or 80+ (Excellent)              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Visual Score Scale

```
     0    10    20    30    40    50    60    70    80    90   100
     ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
     │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│▓▓▓▓▓▓▓▓▓▓▓▓│████████████│
     │         Unacceptable          │  Marginal  │  Acceptable │
     │              F                │     D      │   C  B   A  │
                                     ▲            ▲
                                    51.7         68
                                  (Passing)   (Average)
```

### Interpretation Guidelines

| Score | What It Means | Action Required |
|-------|---------------|-----------------|
| **85+** | Excellent usability. Users love the system. | Minor polish only. Ready for production. |
| **70-84** | Good usability. Users are satisfied. | Address minor issues. Good for production. |
| **68** | Average. Meets minimum expectations. | Identify pain points and improve. |
| **50-67** | Below average. Users struggle with system. | Significant UX improvements needed. |
| **<50** | Poor usability. Users frustrated. | Major redesign required before release. |

---

## SUS Results Report Template

### Final Report Document

```
╔══════════════════════════════════════════════════════════════════════════════╗
║            SUS EVALUATION REPORT - TonyPi Monitoring System                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  PROJECT:           TonyPi Robot Monitoring System                           ║
║  VERSION:           1.0                                                       ║
║  EVALUATION DATE:   ____________________                                     ║
║  EVALUATOR:         ____________________                                     ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                          PARTICIPANT SUMMARY                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Total Participants:     ___                                                 ║
║                                                                               ║
║  By Role:                                                                    ║
║    • Admin:              ___                                                 ║
║    • Operator:           ___                                                 ║
║    • Viewer:             ___                                                 ║
║    • Technician:         ___                                                 ║
║                                                                               ║
║  Average Time Using System: ___ minutes                                      ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                           INDIVIDUAL SCORES                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  ┌────────────┬──────────────┬───────────┬─────────────────────────────────┐ ║
║  │ Respondent │     Role     │ SUS Score │           Visual                │ ║
║  ├────────────┼──────────────┼───────────┼─────────────────────────────────┤ ║
║  │     R1     │    Admin     │    ___    │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ║
║  │     R2     │   Operator   │    ___    │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ║
║  │     R3     │   Operator   │    ___    │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ║
║  │     R4     │    Viewer    │    ___    │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ║
║  │     R5     │  Technician  │    ___    │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ║
║  └────────────┴──────────────┴───────────┴─────────────────────────────────┘ ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                           OVERALL RESULTS                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  ╔════════════════════════════════════════════════════════════════════════╗  ║
║  ║                                                                        ║  ║
║  ║                    AVERAGE SUS SCORE: _______                          ║  ║
║  ║                                                                        ║  ║
║  ║                    Grade:        _______                               ║  ║
║  ║                    Adjective:    _______                               ║  ║
║  ║                    Percentile:   _______                               ║  ║
║  ║                                                                        ║  ║
║  ╚════════════════════════════════════════════════════════════════════════╝  ║
║                                                                               ║
║  Score Breakdown by Role:                                                    ║
║  ─────────────────────────                                                   ║
║    • Admin Average:       ___                                                ║
║    • Operator Average:    ___                                                ║
║    • Viewer Average:      ___                                                ║
║    • Technician Average:  ___                                                ║
║                                                                               ║
║  Score Range:                                                                ║
║  ─────────────                                                               ║
║    • Highest Score:       ___                                                ║
║    • Lowest Score:        ___                                                ║
║    • Standard Deviation:  ___                                                ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                      QUESTION-BY-QUESTION ANALYSIS                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Average response for each question (1-5 scale):                             ║
║                                                                               ║
║  Q1:  Would use frequently          Avg: ___ ████████████░░░░░░░░           ║
║  Q2:  Unnecessarily complex         Avg: ___ ░░░░░░░░░░░░░░░░░░░░           ║
║  Q3:  Easy to use                   Avg: ___ ████████████████░░░░           ║
║  Q4:  Need technical support        Avg: ___ ░░░░░░░░░░░░░░░░░░░░           ║
║  Q5:  Well integrated               Avg: ___ ████████████████░░░░           ║
║  Q6:  Too much inconsistency        Avg: ___ ░░░░░░░░░░░░░░░░░░░░           ║
║  Q7:  Quick to learn                Avg: ___ ████████████████░░░░           ║
║  Q8:  Cumbersome to use             Avg: ___ ░░░░░░░░░░░░░░░░░░░░           ║
║  Q9:  Felt confident                Avg: ___ ████████████████░░░░           ║
║  Q10: Needed to learn a lot         Avg: ___ ░░░░░░░░░░░░░░░░░░░░           ║
║                                                                               ║
║  (For positive questions Q1,3,5,7,9: Higher is better)                       ║
║  (For negative questions Q2,4,6,8,10: Lower is better)                       ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         STRENGTHS IDENTIFIED                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Based on high-scoring questions and user feedback:                          ║
║                                                                               ║
║  1. ________________________________________________________________        ║
║                                                                               ║
║  2. ________________________________________________________________        ║
║                                                                               ║
║  3. ________________________________________________________________        ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                       AREAS FOR IMPROVEMENT                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Based on low-scoring questions and user feedback:                           ║
║                                                                               ║
║  1. ________________________________________________________________        ║
║     Recommendation: ___________________________________________________     ║
║                                                                               ║
║  2. ________________________________________________________________        ║
║     Recommendation: ___________________________________________________     ║
║                                                                               ║
║  3. ________________________________________________________________        ║
║     Recommendation: ___________________________________________________     ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                            CONCLUSION                                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  ☐ EXCELLENT - Score 80+                                                     ║
║    System demonstrates excellent usability. Ready for production.            ║
║                                                                               ║
║  ☐ ACCEPTABLE - Score 68-79                                                  ║
║    System meets usability standards. Minor improvements recommended.         ║
║                                                                               ║
║  ☐ MARGINAL - Score 51-67                                                    ║
║    System usability is below average. Improvements required.                 ║
║                                                                               ║
║  ☐ UNACCEPTABLE - Score <51                                                  ║
║    System has significant usability issues. Redesign needed.                 ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                             SIGN-OFF                                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Prepared By:    ____________________    Date: ____________                  ║
║                                                                               ║
║  Reviewed By:    ____________________    Date: ____________                  ║
║                                                                               ║
║  Approved By:    ____________________    Date: ____________                  ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Quick Reference Card

### SUS at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUS QUICK REFERENCE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SCORING FORMULA:                                                │
│  ─────────────────                                               │
│  • Odd Q (1,3,5,7,9):   Response - 1                            │
│  • Even Q (2,4,6,8,10): 5 - Response                            │
│  • Final Score:         Total × 2.5                              │
│                                                                  │
│  BENCHMARKS:                                                     │
│  ───────────                                                     │
│  • 68 = Average                                                  │
│  • 80+ = Excellent                                               │
│  • 70+ = Good                                                    │
│  • <51 = Poor                                                    │
│                                                                  │
│  REMEMBER:                                                       │
│  ──────────                                                      │
│  • 5+ respondents minimum                                        │
│  • Complete AFTER users try the system                           │
│  • Calculate average of all respondents                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Appendix: Online SUS Calculator

If you prefer not to calculate manually, you can use online SUS calculators:

1. **Calculate by hand** using the worksheet above
2. **Use a spreadsheet** - Create columns with formulas
3. **Online tools** - Search for "SUS Score Calculator"

### Spreadsheet Formula (Excel/Google Sheets)

```
=((Q1-1)+(5-Q2)+(Q3-1)+(5-Q4)+(Q5-1)+(5-Q6)+(Q7-1)+(5-Q8)+(Q9-1)+(5-Q10))*2.5
```

Where Q1-Q10 are cells containing the responses (1-5).

---

*Document Version: 1.0*  
*Last Updated: January 2026*  
*Standard Reference: Brooke, J. (1996). "SUS: A quick and dirty usability scale"*
