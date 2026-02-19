# client_max_body_size 100M KAHAN add karna hai

Ye 2 lines **sirf `http {`** block ke andar add karo — **mail** wale block ke andar ya baad mein nahi.

---

## 1. File kholo

```bash
sudo nano /etc/nginx/nginx.conf
```

---

## 2. `http {` dhoondo (bina #)

- **Galti:** `#mail {` ya koi `#` wala block — uske andar add **mat** karo.
- **Sahi:** File mein woh line dhoondo jahan **sirf** `http {` likha ho (comment nahi).

Example:

```nginx
events {
    worker_connections 768;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    ...
```

---

## 3. `http {` ke turant baad add karo

**Pehle (galat jagah - mail ke paas):**
```nginx
#       #}
    client_max_body_size 100M;    ← GALAT (mail/comment ke paas)
    client_body_buffer_size 256k;
```

**Sahi jagah – `http {` ke andar:**
```nginx
http {
    client_max_body_size 100M;
    client_body_buffer_size 256k;
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
```

Yani **`http {`** ke opening brace ke baad **pehli 2 lines** ye honi chahiye.

---

## 4. Nano mein “Where Is” se dhoondo

- **Ctrl+W** (Where Is)
- Type: `http {`
- Enter

Jahan `http {` dikhe (bina #), wahi pe cursor le jao aur uske next line pe ye add karo:

```nginx
    client_max_body_size 100M;
    client_body_buffer_size 256k;
```

Save: **Ctrl+O**, Enter. Exit: **Ctrl+X**.

---

## 5. Test + reload

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Agar `http {` ke andar sahi add kiya hoga to 413 fix ho jana chahiye.
