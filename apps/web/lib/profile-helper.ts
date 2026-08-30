import { readDatabase } from "@internship-copilot/database";

export async function getStoredProfileData(userIdOrEmail?: string) {
  try {
    const db = readDatabase();
    let user = null;
    if (userIdOrEmail) {
      user = db.users[userIdOrEmail] || Object.values(db.users).find((u) => u.email.toLowerCase() === userIdOrEmail.toLowerCase());
    }
    if (!user) {
      user = Object.values(db.users)[0];
    }
    return user?.profile || { personal: {}, links: {} };
  } catch {
    return { personal: {}, links: {} };
  }
}
