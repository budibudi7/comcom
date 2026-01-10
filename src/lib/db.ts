import { promises as fs } from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const USERS_PATH = path.join(process.cwd(), "storage", "users.json");

export type User = {
    id: string;
    email: string;
    passwordHash: string;
    createdAt: string;
};

async function ensureStorage() {
    await fs.mkdir(path.dirname(USERS_PATH), { recursive: true });
}

export async function getUsers(): Promise<User[]> {
    try {
        const data = await fs.readFile(USERS_PATH, "utf8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

export async function saveUsers(users: User[]) {
    await ensureStorage();
    await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2));
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
    const users = await getUsers();
    return users.find((u) => u.email === email);
}

export async function createUser(email: string, password: string): Promise<User> {
    const users = await getUsers();

    if (users.find((u) => u.email === email)) {
        throw new Error("User already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser: User = {
        id: crypto.randomUUID(),
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await saveUsers(users);

    return newUser;
}

export async function verifyUser(email: string, password: string): Promise<User | null> {
    const user = await getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;

    return user;
}
