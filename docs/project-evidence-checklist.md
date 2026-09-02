# Mahosample Project Evidence Checklist

Use this checklist before project submission, demo, release, or retrospective.

## 1. Final Project Report Structure

- Project Overview: problem, goals, business context, scope, stakeholders
- Requirements Specification: FR, NFR, user stories, acceptance criteria, priority, assumptions, constraints
- Requirements Modeling: use cases, activity flow, sequence flow, prototype, RTM
- Architecture and Design: architecture, ER/data model, API contract, UI/UX, design decisions
- Implementation: technology stack, repository structure, coding standard, key modules, issues, branches, PRs, code reviews
- Testing and Quality: test strategy, test cases, automation, results, quality metrics, known defects
- CI/CD and Release: pipeline, environment, build/deploy evidence, version, release notes
- Security and Responsible Design: threats, privacy, secure coding, OSS licenses, responsible AI usage disclosure
- Product Demo Evidence: screenshots, user flow, deployed URL, QR code if needed
- Retrospective: what went well, what went wrong, lessons learned, improvements
- Appendix: source repo, test evidence, CI logs, meeting/contribution evidence, screenshots

## 2. Requirement Package

Minimum expected content:

- Problem statement
- Stakeholder list with needs and responsibilities
- At least 12 functional requirements
- At least 6 non-functional requirements
- At least 8 user stories
- Acceptance criteria for every user story
- Requirement priority using Must/Should/Could/Won't or High/Medium/Low
- RTM linking requirement -> use case -> design -> code/module -> test case -> evidence -> status

## 3. Technical Evidence

| Evidence Area | Required Evidence | Minimum Quality |
| --- | --- | --- |
| Architecture | Context/component diagram, data model, API/interface contract, design decisions | Explain key reasons and trade-offs |
| Code | Git repository, commits, branching, PRs, coding standard, README | Contribution and review evidence exists |
| Test | Unit/integration/system/acceptance tests and test report | Test cases trace back to requirements |
| CI/CD | Build/test/quality/deploy workflow logs | Real pipeline log evidence exists |
| Release | Version/tag, environment, deployment evidence, rollback/known issues | Clearly identify the submitted version |
| Security | Threat/risk summary, secret handling, dependency/license check | No real secrets committed to repo |

## 4. AI Usage Disclosure

Every AI-assisted work item should record:

- Date
- Tool/model
- Task
- Prompt/context summary
- Output used
- Human verification
- Final decision

Allowed AI use areas:

- Requirements
- Architecture
- Code
- Test
- Documentation
- Debugging
- Data generation
- Presentation support

Do not put passwords, API keys, personal data, customer records, or confidential information into AI prompts.

When AI suggests code or tests, keep evidence separating AI suggestion from team decision.

Example:

```text
AI suggested validation rules -> team reviewed against FR-004/NFR-002 -> code modified -> unit tests passed -> accepted
```

## 5. Rubric Alignment

| Category | Points | Mahosample Evidence |
| --- | ---: | --- |
| Requirements and Traceability | 20 | SRS, user stories, acceptance criteria, RTM |
| Architecture and Design | 15 | Architecture notes, ER/data model, API notes, UI decisions |
| Code and Collaboration | 15 | GitHub repo, branches, PRs, CI checks, review history |
| Testing and Quality | 15 | Pytest, ruff, frontend build, test report, logs |
| CI/CD and Release Evidence | 10 | GitHub Actions, Hostinger VPS deploy logs, environment notes |
| AI Usage Disclosure and Responsible Use | 10 | AI usage log, verification notes, secret handling |
| Product Demo and Technical Presentation | 10 | Live demo URL, screenshots, demo flow |
| Retrospective and Professional Report | 5 | Retrospective and lessons learned |

Target minimum:

- Score at least 60/100
- Must include requirement traceability
- Must include product demo
- Must include test evidence
- Must include repository evidence
- Must include AI usage disclosure

## 6. Current Mahosample Evidence Already Available

- GitHub repository and PR history
- Branch protection with backend/frontend checks
- FastAPI backend with integration tests
- React frontend build evidence
- Docker Compose deployment for Hostinger VPS
- Live VPS deployment on `maho.kitaith.com:18080`
- DNS evidence for `maho.kitaith.com`
- Public registration, staff dashboard, CSV export/import, tracking page

## 7. Evidence Still To Prepare

- Full SRS document
- RTM table
- Architecture/component diagram
- ER/data model diagram
- API contract summary
- Test report exported from CI/local test logs
- Deployment screenshots and URLs
- AI usage log
- Security and privacy note
- Retrospective
- Final presentation/demo script
