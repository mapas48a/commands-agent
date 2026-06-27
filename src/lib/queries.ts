import { categories, commands, type Category, type Command } from "../data/config";

export async function getCategories(): Promise<Category[]> {
  return categories;
}

export async function getCommands(): Promise<Command[]> {
  return commands;
}
