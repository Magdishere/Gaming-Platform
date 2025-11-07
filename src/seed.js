// seed.js
import dotenv from "dotenv";
import { connectDB } from "./db.js";

dotenv.config();

//Seed students
export async function seedStudents() {
  const db = await connectDB();
  const studentsCollection = db.collection(process.env.STUDENTS_COLLECTION_NAME);

  const students = [
    { name: "Alice Johnson", email: "alice.johnson@example.com", age: 20, major: "Computer Science" },
    { name: "Bob Smith", email: "bob.smith@example.com", age: 22, major: "Mechanical Engineering" },
    { name: "Charlie Brown", email: "charlie.brown@example.com", age: 21, major: "Business Administration" },
    { name: "Diana Prince", email: "diana.prince@example.com", age: 23, major: "Political Science" },
    { name: "Ethan Clark", email: "ethan.clark@example.com", age: 20, major: "Physics" },
    { name: "Fiona Davis", email: "fiona.davis@example.com", age: 24, major: "Mathematics" },
    { name: "George Harris", email: "george.harris@example.com", age: 22, major: "Architecture" },
    { name: "Hannah Lewis", email: "hannah.lewis@example.com", age: 21, major: "Psychology" },
    { name: "Ian Martinez", email: "ian.martinez@example.com", age: 20, major: "Chemistry" },
    { name: "Jenna Walker", email: "jenna.walker@example.com", age: 23, major: "Computer Science" },
  ];

  try {
    await studentsCollection.deleteMany({});
    const result = await studentsCollection.insertMany(students);
    console.log(`✅ Seeded ${result.insertedCount} students.`);
    return result.insertedCount;
  } catch (err) {
    console.error("❌ Error seeding students:", err);
    throw err;
  }
}

//Seed Majors
export async function seedMajors() {
  const db = await connectDB();
  const majorsCollection = db.collection(process.env.MAJORS_COLLECTION_NAME);

  const majors = [
    { name: "Computer Science", code: "CS", faculty: "Engineering & Technology" },
    { name: "Mechanical Engineering", code: "ME", faculty: "Engineering & Technology" },
    { name: "Business Administration", code: "BA", faculty: "Business" },
    { name: "Psychology", code: "PSY", faculty: "Social Sciences" },
    { name: "Mathematics", code: "MATH", faculty: "Science" },
    { name: "Political Science", code: "POL", faculty: "Social Sciences" },
    { name: "Chemistry", code: "CHEM", faculty: "Science" },
  ];

  try {
    await majorsCollection.deleteMany({});
    const result = await majorsCollection.insertMany(majors);
    console.log(`✅ Seeded ${result.insertedCount} majors.`);
    return result.insertedCount;
  } catch (err) {
    console.error("❌ Error seeding majors:", err);
    throw err;
  }
}

//Seed Both
export async function seedAll() {
  const studentCount = await seedStudents();
  const majorCount = await seedMajors();
  console.log(`✅ Seeded ${studentCount} students and ${majorCount} majors.`);
}

//Run in CLI, directly
if (process.argv[1].includes("seed.js")) {
  seedAll()
    .then(() => process.exit())
    .catch(() => process.exit(1));
}
