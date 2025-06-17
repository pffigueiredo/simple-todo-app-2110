
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const testTodo = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion',
        completed: false
      })
      .returning()
      .execute();

    const todoId = testTodo[0].id;

    // Delete the todo
    const input: DeleteTodoInput = { id: todoId };
    const result = await deleteTodo(input);

    // Should return success
    expect(result.success).toBe(true);

    // Verify todo was deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false for non-existent todo', async () => {
    const input: DeleteTodoInput = { id: 999 };
    const result = await deleteTodo(input);

    // Should return failure for non-existent todo
    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple test todos
    const todos = await db.insert(todosTable)
      .values([
        { title: 'Todo 1', description: 'First todo', completed: false },
        { title: 'Todo 2', description: 'Second todo', completed: true },
        { title: 'Todo 3', description: 'Third todo', completed: false }
      ])
      .returning()
      .execute();

    // Delete the middle todo
    const input: DeleteTodoInput = { id: todos[1].id };
    const result = await deleteTodo(input);

    expect(result.success).toBe(true);

    // Verify only the targeted todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos.map(t => t.id)).toEqual([todos[0].id, todos[2].id]);
    expect(remainingTodos.map(t => t.title)).toEqual(['Todo 1', 'Todo 3']);
  });
});
