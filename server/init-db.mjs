import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url || url.includes("YOUR_PASSWORD")) {
  console.error("Set DATABASE_URL in .env first, for example:");
  console.error("DATABASE_URL=postgresql://flyapp:YOUR_PASSWORD@127.0.0.1:5433/flymasters");
  process.exit(1);
}

const parsed = new URL(url);
const dbName = parsed.pathname.replace("/", "") || "flymasters";
const adminUrl = new URL(url);
adminUrl.pathname = "/postgres";

async function ensureDatabase() {
  const admin = new pg.Client({ connectionString: adminUrl.toString() });
  try {
    await admin.connect();
    const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE ${dbName}`);
      console.log(`Created database ${dbName}`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }
  } catch (error) {
    if (error.code === "42501" || /permission denied/i.test(error.message)) {
      console.log(`Skipping CREATE DATABASE (${error.message}); using existing ${dbName}`);
      return;
    }
    if (error.code === "3D000") {
      throw error;
    }
    console.log(`Could not inspect postgres database list: ${error.message}`);
  } finally {
    await admin.end().catch(() => {});
  }
}

await ensureDatabase();

const app = new pg.Client({ connectionString: url });
await app.connect();

await app.query(`
  CREATE TABLE IF NOT EXISTS auth_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    user_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS app_records (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_app_records_table ON app_records(table_name);

  CREATE TABLE IF NOT EXISTS app_storage (
    path TEXT PRIMARY KEY,
    data_url TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
  );
`);

const users = await app.query("SELECT COUNT(*)::int AS count FROM auth_users");
if (users.rows[0].count === 0) {
  const now = new Date().toISOString();
  const counselorId = "local-counselor-1";
  const adminId = "local-admin-1";

  await app.query(
    "INSERT INTO auth_users (id, email, password, user_metadata) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)",
    [
      counselorId,
      "counselor@local.test",
      "counselor123",
      JSON.stringify({ first_name: "Priya", last_name: "Counselor" }),
      adminId,
      "admin@local.test",
      "admin123",
      JSON.stringify({ first_name: "Fly", last_name: "Admin" }),
    ]
  );

  const rows = [
    ["user_roles", "role-c1", { id: "role-c1", user_id: counselorId, role: "counselor" }],
    ["user_roles", "role-a1", { id: "role-a1", user_id: adminId, role: "admin" }],
    ["profiles", "profile-c1", { id: "profile-c1", user_id: counselorId, first_name: "Priya", last_name: "Counselor", phone: "", country: "India", created_at: now, updated_at: now }],
    ["profiles", "profile-a1", { id: "profile-a1", user_id: adminId, first_name: "Fly", last_name: "Admin", phone: "", country: "India", created_at: now, updated_at: now }],
    ["counselors", "counselor-row-1", { id: "counselor-row-1", user_id: counselorId, is_active: true, specializations: ["Study Abroad"], experience_years: 5, created_at: now, updated_at: now }],
  ];

  const checklists = [
    ["dc-resume", "Resume", "Must have details of all Education & Job experience.", ["pdf", "doc", "docx"], 1],
    ["dc-sop", "Statement of purpose(SOP)", "University and course based content without plagiarism.", ["pdf", "doc", "docx"], 2],
    ["dc-lor1", "Letter of recommendation(LOR)-1", "Letter of recommendation.", ["pdf"], 3],
    ["dc-lor2", "Letter of recommendation(LOR)-2", "Letter of recommendation.", ["pdf"], 4],
    ["dc-lor3", "Letter of recommendation(LOR)-3", "Letter of recommendation.", ["pdf"], 5],
    ["dc-od", "Original Degree(OD)", "Original degree certificate.", ["pdf", "jpg", "jpeg", "png"], 6],
    ["dc-pc", "Provisional Certificate(PC)", "Provisional certificate.", ["pdf"], 7],
    ["dc-sem", "Semwise Marks Memo's", "Semester-wise marks memos.", ["pdf"], 8],
    ["dc-cmm", "Consolidated Marks Memo(CMM)", "Consolidated marks memo.", ["pdf"], 9],
    ["dc-photo", "Photo(Passport size)", "Recent passport-size photograph.", ["jpg", "jpeg", "png"], 10],
    ["dc-passport-proof", "Passport proof", "Clear color scan of your passport bio page. This is not a passport-size photo.", ["pdf", "jpg", "jpeg", "png"], 11],
    ["dc-aadhaar-proof", "Aadhaar card proof", "Clear scan or photo of your Aadhaar / Adhar card (front and back).", ["pdf", "jpg", "jpeg", "png"], 12],
  ];

  for (const [id, document_type, description, allowed_file_types, display_order] of checklists) {
    rows.push([
      "document_checklists",
      id,
      {
        id,
        document_type,
        description,
        is_required: true,
        is_active: true,
        max_file_size_mb: 20,
        allowed_file_types,
        country: "All",
        countries: ["All"],
        degree_type: "All",
        degree_types: ["All"],
        display_order,
      },
    ]);
  }

  rows.push(["universities", "uni-ku", { id: "uni-ku", name: "Kathmandu University", country: "Nepal", city: "Dhulikhel", ranking: 1, is_active: true, website_url: "https://ku.edu.np" }]);
  rows.push(["universities", "uni-tu", { id: "uni-tu", name: "Tribhuvan University IOE Pulchowk", country: "Nepal", city: "Lalitpur", ranking: 2, is_active: true, website_url: "https://ioe.edu.np" }]);

  const documentCountries = [
    ["doc-country-all", "All", "ALL", 0],
    ["doc-country-usa", "USA", "USA", 1],
    ["doc-country-uk", "UK", "UK", 2],
    ["doc-country-canada", "Canada", "CA", 3],
    ["doc-country-australia", "Australia", "AU", 4],
    ["doc-country-germany", "Germany", "DE", 5],
    ["doc-country-nepal", "Nepal", "NP", 6],
    ["doc-country-india", "India", "IN", 7],
  ];
  for (const [id, name, code, display_order] of documentCountries) {
    rows.push(["document_countries", id, { id, name, code, is_active: true, display_order }]);
  }

  const documentDegrees = [
    ["doc-degree-all", "All", "ALL", 0],
    ["doc-degree-bachelors", "Bachelors", "UG", 1],
    ["doc-degree-masters", "Masters", "PG", 2],
    ["doc-degree-phd", "PhD", "PHD", 3],
    ["doc-degree-diploma", "Diploma", "DIP", 4],
    ["doc-degree-certificate", "Certificate", "CERT", 5],
    ["doc-degree-other", "Other", "OTHER", 6],
  ];
  for (const [id, name, code, display_order] of documentDegrees) {
    rows.push(["document_degree_types", id, { id, name, code, is_active: true, display_order }]);
  }

  for (const [tableName, id, data] of rows) {
    await app.query("INSERT INTO app_records (id, table_name, data) VALUES ($1, $2, $3)", [id, tableName, JSON.stringify(data)]);
  }

  await app.query("INSERT INTO app_meta (key, value) VALUES ('session', 'null'::jsonb) ON CONFLICT (key) DO NOTHING");
  console.log("Seeded counselor, admin, checklists, and universities");
} else {
  console.log("Auth users already present; skipping seed");
}

const info = await app.query("SELECT current_user AS user, current_database() AS database, inet_server_port() AS port");
console.log(`Connected to PostgreSQL as ${info.rows[0].user} on port ${info.rows[0].port}/${info.rows[0].database}`);
await app.end();
