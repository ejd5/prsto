"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type TodoData = {
  id: string;
  opportunityId: string;
  title: string;
  done: boolean;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getTodos(opportunityId: string): Promise<TodoData[]> {
  try {
    const list = await prisma.opportunityTodo.findMany({
      where: { opportunityId },
      orderBy: { createdAt: "asc" },
    });
    return list as TodoData[];
  } catch (e) {
    console.error("Error in getTodos:", e);
    return [];
  }
}

export async function addTodo(opportunityId: string, title: string, dueDateString?: string): Promise<TodoData | null> {
  try {
    const dueDate = dueDateString ? new Date(dueDateString) : null;
    const todo = await prisma.opportunityTodo.create({
      data: {
        opportunityId,
        title,
        done: false,
        dueDate,
      },
    });
    revalidatePath(`/opportunites/${opportunityId}`);
    return todo as TodoData;
  } catch (e) {
    console.error("Error in addTodo:", e);
    return null;
  }
}

export async function toggleTodo(id: string, done: boolean, opportunityId: string): Promise<boolean> {
  try {
    await prisma.opportunityTodo.update({
      where: { id },
      data: { done },
    });
    revalidatePath(`/opportunites/${opportunityId}`);
    return true;
  } catch (e) {
    console.error("Error in toggleTodo:", e);
    return false;
  }
}

export async function deleteTodo(id: string, opportunityId: string): Promise<boolean> {
  try {
    await prisma.opportunityTodo.delete({
      where: { id },
    });
    revalidatePath(`/opportunites/${opportunityId}`);
    return true;
  } catch (e) {
    console.error("Error in deleteTodo:", e);
    return false;
  }
}
