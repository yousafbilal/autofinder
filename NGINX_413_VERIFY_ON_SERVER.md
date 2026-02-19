# 413 ab bhi aa raha ho? Server par ye check karo

## 1. Kaunsi config actually use ho rahi hai

Run:

```bash
sudo nginx -T 2>/dev/null | grep -E "server_name|client_max_body_size"
```

- Agar **client_max_body_size** kahin bhi **1m** ya **default** dikhe, to wahi 413 ka reason hai.
- **backend.autofinder.pk** jis `server { }` ke andar aata hai, us block mein **client_max_body_size 100M;** hona chahiye.

## 2. Main nginx.conf mein global limit

Agar site-specific config theek hai phir bhi 413 aaye, to main config check karo:

```bash
sudo nano /etc/nginx/nginx.conf
```

**http { }** block ke andar (server blocks ke bahar) ye add ya update karo:

```nginx
http {
    ...
    client_max_body_size 100M;
    ...
}
```

Save karke:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 3. Sites-enabled mein sahi file linked hai?

```bash
ls -la /etc/nginx/sites-enabled/
```

Agar **autofinder-backend** nahi dikhe to link banao:

```bash
sudo ln -sf /etc/nginx/sites-available/autofinder-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 4. Cloudflare / koi aur proxy

Agar request pehle **Cloudflare** (ya koi proxy) se guzarti hai, to wahan bhi body size limit check karo. Cloudflare free plan par bhi limit hoti hai; agar need ho to plan ya settings mein dekhna padega.

---

**App side:** Ab images upload se pehle **compress** ho rahi hain (1024px, 65% quality), isse size kam ho jata hai. Phir bhi 413 aaye to upar wale server steps zaroor run karo.
