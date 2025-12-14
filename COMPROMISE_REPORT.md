# Security Compromise Diagnostic Report

## Executive Summary
The project was compromised because the **PostgreSQL database was exposed to the public internet with default, hardcoded superuser credentials**. This allowed an attacker to connect to the database, authenticate as a superuser, and execute arbitrary system commands (RCE) to install a crypto-miner and backdoor malware.

## Critical Vulnerabilities Identified

### 1. Exposed Database Port
- **File:** `docker-compose.yml` (Line 52)
- **Code:**
  ```yaml
  ports:
    - "5433:5432" # Expose DB on 5433 to avoid local conflicts
  ```
- **Impact:** This maps the container's internal Postgres port (5432) to the VPS host's port 5433. If the VPS firewall is not strictly configured (which is common in default deployments), port 5433 is accessible from the entire internet.

### 2. Default Weak Credentials
- **File:** `docker-compose.yml` (Lines 29, 32-35) & `configure-postgres.sh` (Lines 35, 53)
- **Code (configure-postgres.sh):**
  ```bash
  su-exec postgres psql -c "CREATE USER kickai WITH SUPERUSER PASSWORD 'kickai';"
  ```
- **Impact:** The database user `kickai` is created with the password `kickai`. These credentials are hardcoded and publicly visible in the repository.

### 3. Superuser Privileges
- **File:** `configure-postgres.sh` (Line 35)
- **Code:** `CREATE USER kickai WITH SUPERUSER ...`
- **Impact:** The `kickai` user is granted `SUPERUSER` rights. In PostgreSQL, a superuser can execute commands on the underlying operating system (e.g., using `COPY FROM PROGRAM` or malicious extensions). This is the direct path from "DB Access" to "Server Takeover".

### 4. Permissive Network Configuration
- **File:** `init-postgres.sh` (Lines 111, 119)
- **Code:**
  ```bash
  echo "listen_addresses = '*'" >> "$PGDATA/postgresql.conf"
  echo "host all all 0.0.0.0/0 md5" >> "$PGDATA/pg_hba.conf"
  ```
- **Impact:** This explicitly configures Postgres to accept connections from *any* IP address (`0.0.0.0/0`), removing the last line of defense.

## Attack Reconstruction
1.  **Reconnaissance:** Attacker scans IP ranges for open port `5433`.
2.  **Access:** Attacker connects to port `5433` and tries default/common credentials. The hardcoded `kickai:kickai` works.
3.  **Escalation:** Authenticated as `SUPERUSER`, the attacker executes a command to download and run a shell script (likely using `COPY ... FROM PROGRAM 'curl ... | sh'`).
4.  **Payload:** The script installs the crypto-miner (process `/var/tmp/softirq`) and persistence mechanisms (the randomly named binary `fnlthydmq`).
5.  **Denial of Service:** The malware consumes network resources and potentially corrupts the container networking, causing the Healthy Check `curl http://localhost:3000/api/health` to timeout (Exit Code 28), leading Coolify to report "No available server".

## Remediation Steps for the AI/Developer
1.  **Immediate Action:** Destroy the compromised container and volume. Do not attempt to clean it; it is untrustworthy.
2.  **Code Fixes:**
    *   **Remove Port Mapping:** Delete `- "5433:5432"` from `docker-compose.yml`. Applications should connect via the internal Docker network, not the public internet.
    *   **Use Secrets:** Do not hardcode passwords. Use Docker Secrets or environment variables loaded from a secure source (Coolify secrets).
    *   **Least Privilege:** Do not grant `SUPERUSER` to the application user. Grant only necessary permissions (`GRANT ALL ON DATABASE ...`).
    *   **Network Restriction:** If external access is truly required (unlikely), bind to `127.0.0.1` (`127.0.0.1:5433:5432`) and use an SSH tunnel, or use a firewall (UFW) to whitelist trusted IPs.
