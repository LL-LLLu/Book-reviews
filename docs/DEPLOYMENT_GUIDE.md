# Public Deployment Guide for Book Review App

This guide provides a comprehensive walkthrough for deploying the Book Review App to a public server, making it securely accessible from anywhere in the world.

The strategy involves using Docker Compose to run the application and Nginx Proxy Manager (also in Docker) to handle HTTPS/SSL and act as a secure reverse proxy.

---

### Prerequisites

1.  **A Domain Name**: You need a registered domain (e.g., from Namecheap, GoDaddy).
2.  **A Linux Server**: A cloud server (VPS) like an AWS EC2 instance (t2.micro is a good start), DigitalOcean Droplet, etc. Ubuntu 22.04 LTS is recommended.
3.  **Git and Docker**: Ensure `git`, `docker`, and `docker-compose` are installed on your server.

---

## Step 1: Point Your Domain to the Server

After provisioning your server, you will get a public IP address. Go to your domain registrar's DNS settings and create an **A record** that points your domain to this public IP.

-   **Type**: `A`
-   **Host/Name**: `@` (for the root domain `your-domain.com`)
-   **Value/Points to**: `<your-server-public-ip>`
-   **TTL**: Leave as default.

*(DNS changes can take some time to propagate).*

---

## Step 2: Configure Server Firewall

Log into your server via SSH. Configure your firewall to allow traffic only on the necessary ports. If using AWS, configure the instance's Security Group.

**Allow incoming traffic on:**
-   **Port 22 (SSH)**: From **Your IP Only**. This is critical for security.
-   **Port 80 (HTTP)**: From **Anywhere** (`0.0.0.0/0`). Needed for the Let's Encrypt SSL certificate challenge.
-   **Port 443 (HTTPS)**: From **Anywhere** (`0.0.0.0/0`). For public web traffic.
-   **Port 81 (TCP)**: From **Your IP Only**. For accessing the Nginx Proxy Manager admin UI.

**Important**: Do NOT expose the application ports (`3000`, `5001`, `27017`) to the public internet. The reverse proxy will manage access.

---

## Step 3: Set Up and Secure the Application

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/LL-LLLu/Book-reviews.git /opt/book-review-app
    cd /opt/book-review-app
    ```

2.  **Create Persistent Directories**:
    Run the setup script to ensure directories for the database and file uploads exist with the correct permissions.
    ```bash
    ./setup.sh
    ```

3.  **Create and Secure the `.env` File**:
    Copy the example and then edit it with your production values.
    ```bash
    cp .env.example .env
    nano .env
    ```
    **Fill this file out carefully:**
    -   **Secrets**: Generate long, random strings for `MONGO_PASSWORD`, `JWT_SECRET`, and `NEXTAUTH_SECRET`. You can use `openssl rand -base64 32` on your server to generate them.
    -   **Google OAuth**: Follow the instructions in the `CLAUDE.md` or original README to get your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
        -   Authorized JavaScript origins: `https://your-domain.com`
        -   Authorized redirect URIs: `https://your-domain.com/api/auth/callback/google`
    -   **URLs**: This is crucial. Update the URLs to use your domain.
        ```
        FRONTEND_URL=https://your-domain.com
        NEXTAUTH_URL=https://your-domain.com
        NEXT_PUBLIC_API_URL=https://your-domain.com/api
        NEXT_PUBLIC_BASE_URL=https://your-domain.com
        ```
        *Note: The project is configured for the frontend and backend to be served from the same domain, with Next.js proxying API requests.*

---

## Step 4: Deploy the Application with Docker

With your `.env` file configured, launch the main application.

```bash
# Ensure you are in /opt/book-review-app
docker-compose up -d --build
```
This command builds the images and starts the `frontend`, `backend`, and `mongodb` containers. It also creates a shared Docker network named `book-review-app_book-review-network` (assuming your directory is `/opt/book-review-app`).

---

## Step 5: Set Up the Reverse Proxy (Nginx Proxy Manager)

This proxy will manage web traffic and SSL certificates.

1.  **Create a Directory for the Proxy**:
    ```bash
    mkdir -p /opt/nginx-proxy-manager
    cd /opt/nginx-proxy-manager
    ```

2.  **Create the Proxy's `docker-compose.yml`**:
    Create a new file named `docker-compose-proxy.yml` and add the following content.
    ```yaml
    version: '3.8'
    services:
      app:
        image: 'jc21/nginx-proxy-manager:latest'
        container_name: nginx-proxy-manager
        restart: unless-stopped
        ports:
          - '80:80'   # Public HTTP Port
          - '443:443' # Public HTTPS Port
          - '81:81'   # Admin Web UI Port
        volumes:
          - ./data:/data
          - ./letsencrypt:/etc/letsencrypt

    networks:
      default:
        # Connect to the network created by the main app's docker-compose
        name: book-review-app_book-review-network
        external: true
    ```

3.  **Launch the Proxy**:
    ```bash
    # Ensure you are in /opt/nginx-proxy-manager
    docker-compose -f docker-compose-proxy.yml up -d
    ```

---

## Step 6: Configure the Proxy and SSL

1.  **Log in to the Admin Panel**:
    -   Navigate to `http://<your-server-ip>:81`.
    -   Default Credentials: Email: `admin@example.com`, Password: `changeme`.
    -   You will be prompted to change these immediately.

2.  **Create the Proxy Host**:
    -   Go to **Hosts > Proxy Hosts** and click **"Add Proxy Host"**.
    -   **Details Tab**:
        -   **Domain Names**: Enter `your-domain.com`. You can add `www.your-domain.com` on a new line if you have a DNS record for it.
        -   **Scheme**: `http`
        -   **Forward Hostname / IP**: `book-review-frontend` (This must match the service name in your main `docker-compose.yml`).
        -   **Forward Port**: `3000`
        -   Enable **Block Common Exploits**.
    -   **SSL Tab**:
        -   **SSL Certificate**: Select **"Request a new SSL Certificate"**.
        -   Enable **Force SSL**. This redirects all HTTP traffic to HTTPS.
        -   Enable **HTTP/2 Support**.
        -   Agree to the Let's Encrypt Terms of Service.
    -   **Click Save**.

Nginx Proxy Manager will now automatically request an SSL certificate. After a moment, you should be able to securely access your application at `https://your-domain.com`.

---

### Final Checks

-   Visit `https://your-domain.com`. You should see the application, and your browser should show a lock icon, indicating a secure connection.
-   Test the core features: registration, login (including Google OAuth), creating a review, and uploading a profile picture.
-   Check the container logs if you encounter any issues:
    ```bash
    # For the application
    cd /opt/book-review-app && docker-compose logs -f

    # For the proxy
    cd /opt/nginx-proxy-manager && docker-compose -f docker-compose-proxy.yml logs -f
    ```
