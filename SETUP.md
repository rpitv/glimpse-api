git clone this repo and cd into the base folder

<hr>

run 
```bash
npm i
```

<hr>

setup/get .env file.

in the .env file set
```properties
HTTPS=false
```
otherwise get a self signed certificate for https

<hr>

in .env change the @db part to @localhost
```properties
# before
DATABASE_URL="postgresql://postgres:password@db:5432/postgres?schema=public&connect_timeout=300"

# after                                      ↓
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres?schema=public&connect_timeout=300"
```

<hr>

run to start Docker
```bash
docker compose up
```

<hr>

run to update db schema (first time)
```bash
npx prisma db push
```

<hr>

revert the change made earlier so localhost should now be db
```properties
DATABASE_URL="postgresql://postgres:password@db:5432/..."
```

<hr>

restart docker

<hr>

connect to the postgresql database with
username: **postgres**
password: **password**


run the following SQL on the database

```sql
INSERT INTO groups (id, name, parent, priority)
VALUES (
    1,
    'Guest',
    null,
    0
  );

INSERT INTO group_permissions (
    group,
    action,
    subject
  )
VALUES (
    1,
    'manage',
    ARRAY ['all']
  );
```

<hr>

goto http://localhost:4000/graphql to confirm it works,
there should be no errors in the textarea on right,
if it is broken try clearing cookies 

do test with this query:
[*shortcut*](http://localhost:4000/graphql?query=query+%7B%0A++findManyGroup%7B%0A++++name%0A++%7D%0A%7D)
```sql
query {
  findManyGroup{
    name
  }
}
```
