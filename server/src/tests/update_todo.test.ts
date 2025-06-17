
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestTodo = async (): Promise<number> => {
    // Create todo directly in database for testing
    const result = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A test todo item',
        completed: false
      })
      .returning()
      .execute();
    
    return result[0].id;
  };

  it('should update todo title', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todoId);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('A test todo item'); // Should remain unchanged
    expect(result!.completed).toEqual(false); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update todo description', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      description: 'Updated description'
    };

    const result = await updateTodo(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todoId);
    expect(result!.title).toEqual('Test Todo'); // Should remain unchanged
    expect(result!.description).toEqual('Updated description');
    expect(result!.completed).toEqual(false); // Should remain unchanged
  });

  it('should update todo completed status', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todoId);
    expect(result!.title).toEqual('Test Todo'); // Should remain unchanged
    expect(result!.description).toEqual('A test todo item'); // Should remain unchanged
    expect(result!.completed).toEqual(true);
  });

  it('should update multiple fields', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      title: 'Updated Title',
      description: 'Updated description',
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todoId);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Updated description');
    expect(result!.completed).toEqual(true);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      description: null
    };

    const result = await updateTodo(updateInput);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
  });

  it('should return null for non-existent todo', async () => {
    const updateInput: UpdateTodoInput = {
      id: 99999,
      title: 'Non-existent'
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeNull();
  });

  it('should save changes to database', async () => {
    const todoId = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: todoId,
      title: 'Database Updated Title',
      completed: true
    };

    await updateTodo(updateInput);

    // Verify changes were saved to database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Database Updated Title');
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    const todoId = await createTestTodo();
    
    // Get original timestamp
    const originalTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();
    const originalUpdatedAt = originalTodos[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTodoInput = {
      id: todoId,
      title: 'Updated for timestamp test'
    };

    const result = await updateTodo(updateInput);

    expect(result).not.toBeNull();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
