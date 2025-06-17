
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all todos ordered by creation date (newest first)', async () => {
    // Create test todos with slight delays to ensure different timestamps
    const todo1 = await db.insert(todosTable)
      .values({
        title: 'First Todo',
        description: 'First description',
        completed: false
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const todo2 = await db.insert(todosTable)
      .values({
        title: 'Second Todo',
        description: 'Second description',
        completed: true
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const todo3 = await db.insert(todosTable)
      .values({
        title: 'Third Todo',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);

    // Should be ordered by creation date (newest first)
    expect(result[0].title).toEqual('Third Todo');
    expect(result[1].title).toEqual('Second Todo');
    expect(result[2].title).toEqual('First Todo');

    // Verify all fields are properly returned
    result.forEach(todo => {
      expect(todo.id).toBeDefined();
      expect(typeof todo.title).toBe('string');
      expect(typeof todo.completed).toBe('boolean');
      expect(todo.created_at).toBeInstanceOf(Date);
      expect(todo.updated_at).toBeInstanceOf(Date);
      expect(todo.description === null || typeof todo.description === 'string').toBe(true);
    });
  });

  it('should handle todos with null descriptions', async () => {
    await db.insert(todosTable)
      .values({
        title: 'Todo with null description',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Todo with null description');
    expect(result[0].description).toBeNull();
    expect(result[0].completed).toBe(false);
  });

  it('should return todos with correct boolean values', async () => {
    await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: 'A completed task',
        completed: true
      })
      .returning()
      .execute();

    await db.insert(todosTable)
      .values({
        title: 'Incomplete Todo', 
        description: 'An incomplete task',
        completed: false
      })
      .returning()
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    
    const completedTodo = result.find(todo => todo.title === 'Completed Todo');
    const incompleteTodo = result.find(todo => todo.title === 'Incomplete Todo');

    expect(completedTodo?.completed).toBe(true);
    expect(incompleteTodo?.completed).toBe(false);
  });
});
