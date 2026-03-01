# Security Policy

## Network Access

This package performs **outgoing HTTP requests only** to the URL that **you** configure via `configure({ endpoint })` or your `onError` callback. No requests are made to third-party servers, to the maintainers, or to any URL not under your control. No telemetry or analytics are sent by the library. You own the destination and the data.

## Supported Versions

Only the latest version of SyntropyFront is supported for security updates.

| Version | Supported          |
| ------- | ------------------ |
| >= 0.4.x| :white_check_mark: |
| < 0.4.0 | :x:                |

## Reporting a Vulnerability

We take the security of SyntropyFront seriously. If you believe you have found a security vulnerability, please report it to us as soon as possible.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report vulnerabilities by emailing Gabriel Alejandro Gomez at gabriel70@gmail.com.

When reporting a vulnerability, please include:
- A clear description of the vulnerability.
- Steps to reproduce the issue.
- Potential impact.

We will acknowledge your report within 48 hours and provide a timeline for addressing the issue. We appreciate your efforts to keep the project and its users secure.
