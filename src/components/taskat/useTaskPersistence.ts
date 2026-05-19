"use client";

import { useState, useEffect, useCallback } from "react";

export interface LocalTask {
  id: string;
  title: string;
  time?: string;
  lectureId?: string | null;
  completed: boolean;
  date: string; // ISO Date String (YYYY-MM-DD)
  createdAt: number;
  priority?: "HIGH" | "MEDIUM" | "LOW";
}

export function useTaskPersistence(userId: string, selectedDate: Date) {
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Format date as YYYY-MM-DD for storage keys
  const dateKey = selectedDate.toISOString().split("T")[0];
  const storageKey = `medqs-tasks-${userId}`;

  // Load tasks from localStorage
  useEffect(() => {
    setLoading(true);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const allTasks: LocalTask[] = JSON.parse(saved);
        // Filter by selected date
        const filtered = allTasks.filter(t => t.date === dateKey);
        setTasks(filtered);
      } catch (e) {
        console.error("Failed to parse local tasks", e);
        setTasks([]);
      }
    } else {
      setTasks([]);
    }
    setLoading(false);
  }, [userId, dateKey, storageKey]);

  const addTask = useCallback((taskData: Omit<LocalTask, "id" | "createdAt" | "date" | "completed">) => {
    const newTask: LocalTask = {
      ...taskData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      date: dateKey,
      completed: false,
    };

    const saved = localStorage.getItem(storageKey);
    const allTasks: LocalTask[] = saved ? JSON.parse(saved) : [];
    const updated = [...allTasks, newTask];
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, [dateKey, storageKey]);

  const toggleTask = useCallback((taskId: string) => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    const allTasks: LocalTask[] = JSON.parse(saved);
    const updated = allTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    
    // Update local state if it's currently showing this task
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    
    return updated.find(t => t.id === taskId);
  }, [storageKey]);

  const deleteTask = useCallback((taskId: string) => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    const allTasks: LocalTask[] = JSON.parse(saved);
    const updated = allTasks.filter(t => t.id !== taskId);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, [storageKey]);

  return { tasks, loading, addTask, toggleTask, deleteTask };
}
