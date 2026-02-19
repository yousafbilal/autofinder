# App: Na Data Show Ho Raha, Na Post Ho Raha – Server Check

## Server par yeh steps chalao (ek ek karke)

### 1. Backend chal raha hai?
```bash
pm2 status
```
- **online** hona chahiye. Agar **errored** hai to: `pm2 logs autofinder --lines 30 --nostream`

### 2. Backend respond kar raha hai?
```bash
curl -s http://localhost:8001/health
```
- Kuch bhi JSON (jaise `{"status":"ok",...}`) aana chahiye. Agar **Connection refused** aaye to backend band hai.

### 3. MongoDB connect hai?
```bash
curl -s "http://localhost:8001/health/detailed"
```
- Agar `"mongodb":"connected"` ho to DB theek hai. Agar **disconnected** ho to **node.env** check karo (MONGODB_URI sahi hai?).

### 4. Data (used cars / ads) backend se aa raha hai?
```bash
curl -s "http://localhost:8001/all_ads" | head -c 500
```
- Agar `[]` (empty array) aaye to DB connect hai lekin ads empty ho sakte hain ya query fail.
- Agar **JSON array** with data aaye to backend theek hai – problem app ya network side.

### 5. Env load ho rahi hai?
```bash
cd /var/www/autofinder
ls -la .env node.env
cat node.env | head -2
```
- Dono files honi chahiye. `node.env` mein `MONGODB_URI=...` hona chahiye.

### 6. PM2 sahi folder se start hua?
```bash
pm2 show autofinder
```
- **exec cwd** = `/var/www/autofinder` hona chahiye. Agar alag hai to:
```bash
cd /var/www/autofinder
pm2 delete autofinder
pm2 start index.js --name autofinder
pm2 save
```

---

## Summary

| Check           | Command                    | Theek hone par kya dikhega      |
|----------------|----------------------------|----------------------------------|
| Backend run    | `pm2 status`               | autofinder **online**            |
| API respond    | `curl localhost:8001/health`| JSON with status ok              |
| DB connected   | `curl localhost:8001/health/detailed` | mongodb: connected       |
| Data aa raha   | `curl localhost:8001/all_ads` | JSON array (empty ya with ads) |
| Env + cwd      | `pm2 show` + `ls .env node.env` | cwd = /var/www/autofinder, files exist |

In sab ka output bhejo – phir exact bata sakte hain kahan fix karna hai.
