const bcrypt = require("bcryptjs");
const { withTransaction } = require("./db");

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin";

const schemaStatements = [
  `
  CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    age INTEGER CHECK (age IS NULL OR age >= 0),
    class_name VARCHAR(120),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    credit NUMERIC(5,2),
    teacher VARCHAR(120),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    title VARCHAR(120),
    phone VARCHAR(40),
    email VARCHAR(160),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,
  `
  CREATE OR REPLACE FUNCTION trigger_set_timestamp()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  `,
  `
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'set_timestamp_students'
    ) THEN
      CREATE TRIGGER set_timestamp_students
      BEFORE UPDATE ON students
      FOR EACH ROW
      EXECUTE PROCEDURE trigger_set_timestamp();
    END IF;
  END
  $$;
  `,
  `
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'set_timestamp_courses'
    ) THEN
      CREATE TRIGGER set_timestamp_courses
      BEFORE UPDATE ON courses
      FOR EACH ROW
      EXECUTE PROCEDURE trigger_set_timestamp();
    END IF;
  END
  $$;
  `,
  `
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'set_timestamp_teachers'
    ) THEN
      CREATE TRIGGER set_timestamp_teachers
      BEFORE UPDATE ON teachers
      FOR EACH ROW
      EXECUTE PROCEDURE trigger_set_timestamp();
    END IF;
  END
  $$;
  `,
];

async function initializeDatabase() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  return withTransaction(async (client) => {
    for (const statement of schemaStatements) {
      await client.query(statement);
    }

    await client.query(
      `
      INSERT INTO admins (username, password_hash)
      VALUES ($1, $2)
      ON CONFLICT (username) DO NOTHING;
      `,
      [ADMIN_USERNAME, passwordHash]
    );

    return {
      message: "数据库初始化完成",
      defaultAdmin: {
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
      },
    };
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const result = await initializeDatabase();
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("初始化数据库失败", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "初始化失败" }),
    };
  }
};

