
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus, CheckSquare2, Square } from 'lucide-react';
// Using type-only import for better TypeScript compliance
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  // Explicit typing with Todo interface
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state with proper typing for nullable fields
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // useCallback to memoize function used in useEffect
  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty deps since trpc is stable

  // useEffect with proper dependencies
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await trpc.createTodo.mutate(formData);
      // Update todos list with explicit typing in setState callback
      setTodos((prev: Todo[]) => [response, ...prev]);
      // Reset form
      setFormData({
        title: '',
        description: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updateData: UpdateTodoInput = {
        id: todo.id,
        completed: !todo.completed
      };
      
      const updatedTodo = await trpc.updateTodo.mutate(updateData);
      
      if (updatedTodo) {
        setTodos((prev: Todo[]) =>
          prev.map((t: Todo) => t.id === todo.id ? updatedTodo : t)
        );
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setEditFormData({
      title: todo.title,
      description: todo.description
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo) return;
    
    setIsUpdating(true);
    try {
      const updateData: UpdateTodoInput = {
        id: editingTodo.id,
        title: editFormData.title,
        description: editFormData.description
      };
      
      const updatedTodo = await trpc.updateTodo.mutate(updateData);
      
      if (updatedTodo) {
        setTodos((prev: Todo[]) =>
          prev.map((t: Todo) => t.id === editingTodo.id ? updatedTodo : t)
        );
      }
      
      setIsEditDialogOpen(false);
      setEditingTodo(null);
      setEditFormData({ title: '', description: null });
    } catch (error) {
      console.error('Failed to update todo:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (todoId: number) => {
    try {
      const result = await trpc.deleteTodo.mutate({ id: todoId });
      
      if (result.success) {
        setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📝 Todo Manager</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
          {totalCount > 0 && (
            <div className="flex justify-center gap-4 mt-4">
              <Badge variant="outline" className="text-sm">
                Total: {totalCount}
              </Badge>
              <Badge variant="default" className="text-sm bg-green-500">
                Completed: {completedCount}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                Remaining: {totalCount - completedCount}
              </Badge>
            </div>
          )}
        </div>

        <div className="mb-6 flex justify-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow-md">
                <Plus className="w-5 h-5 mr-2" />
                Add New Todo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Todo</DialogTitle>
                <DialogDescription>
                  Add a new task to your todo list. Fill in the details below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter todo title"
                      value={formData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter todo description (optional)"
                      value={formData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreateTodoInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Todo'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Todo</DialogTitle>
              <DialogDescription>
                Update your todo details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    placeholder="Enter todo title"
                    value={editFormData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Enter todo description (optional)"
                    value={editFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditFormData((prev: CreateTodoInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Todo'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : todos.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No todos yet</h3>
              <p className="text-gray-500 mb-4">Create your first todo to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {todos.map((todo: Todo) => (
              <Card key={todo.id} className={`transition-all duration-200 hover:shadow-md ${
                todo.completed ? 'bg-green-50 border-green-200' : 'bg-white'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => handleToggleComplete(todo)}
                        className="mt-1 transition-colors hover:scale-110"
                      >
                        {todo.completed ? (
                          <CheckSquare2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                      <div className="flex-1">
                        <CardTitle className={`text-lg ${
                          todo.completed ? 'line-through text-gray-500' : 'text-gray-800'
                        }`}>
                          {todo.title}
                        </CardTitle>
                        {todo.description && (
                          <CardDescription className={`mt-2 ${
                            todo.completed ? 'line-through text-gray-400' : 'text-gray-600'
                          }`}>
                            {todo.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(todo)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Todo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(todo.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Created: {todo.created_at.toLocaleDateString()}</span>
                    <Badge variant={todo.completed ? "default" : "secondary"} className="text-xs">
                      {todo.completed ? "✅ Completed" : "⏳ Pending"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
