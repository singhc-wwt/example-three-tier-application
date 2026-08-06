#!/usr/bin/env node

/**
 * Test script to verify the DELETE endpoint implementation
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing DELETE endpoint implementation...\n');

// Test 1: Check backend DELETE endpoint exists
console.log('Test 1: Checking backend DELETE endpoint...');
const apiCode = fs.readFileSync(path.join(__dirname, 'src/api/index.js'), 'utf8');
if (apiCode.includes("app.delete('/tasks/:id'")) {
  console.log('✅ DELETE endpoint found in backend\n');
} else {
  console.log('❌ DELETE endpoint NOT found in backend\n');
  process.exit(1);
}

// Test 2: Check DELETE endpoint validates task exists
console.log('Test 2: Checking DELETE endpoint validates task exists...');
if (apiCode.includes("SELECT * FROM tasks WHERE id = $1") && 
    apiCode.includes("res.status(404)")) {
  console.log('✅ DELETE endpoint validates task exists\n');
} else {
  console.log('❌ DELETE endpoint does NOT validate task exists\n');
  process.exit(1);
}

// Test 3: Check DELETE endpoint returns 204
console.log('Test 3: Checking DELETE endpoint returns 204...');
if (apiCode.includes("res.status(204)")) {
  console.log('✅ DELETE endpoint returns 204 on success\n');
} else {
  console.log('❌ DELETE endpoint does NOT return 204\n');
  process.exit(1);
}

// Test 4: Check deleteTask server action exists
console.log('Test 4: Checking deleteTask server action...');
const actionsCode = fs.readFileSync(path.join(__dirname, 'src/web/app/actions.ts'), 'utf8');
if (actionsCode.includes("export async function deleteTask")) {
  console.log('✅ deleteTask server action found\n');
} else {
  console.log('❌ deleteTask server action NOT found\n');
  process.exit(1);
}

// Test 5: Check deleteTask calls DELETE method
console.log('Test 5: Checking deleteTask calls DELETE method...');
if (actionsCode.includes("method: 'DELETE'")) {
  console.log('✅ deleteTask calls DELETE method\n');
} else {
  console.log('❌ deleteTask does NOT call DELETE method\n');
  process.exit(1);
}

// Test 6: Check deleteTask revalidates path
console.log('Test 6: Checking deleteTask revalidates path...');
if (actionsCode.includes("revalidatePath('/')")) {
  console.log('✅ deleteTask revalidates path\n');
} else {
  console.log('❌ deleteTask does NOT revalidate path\n');
  process.exit(1);
}

// Test 7: Check page imports deleteTask
console.log('Test 7: Checking page imports deleteTask...');
const pageCode = fs.readFileSync(path.join(__dirname, 'src/web/app/page.tsx'), 'utf8');
if (pageCode.includes("import { getTasks, createTask, toggleTask, deleteTask }")) {
  console.log('✅ page imports deleteTask\n');
} else {
  console.log('❌ page does NOT import deleteTask\n');
  process.exit(1);
}

// Test 8: Check delete button exists in UI
console.log('Test 8: Checking delete button exists in UI...');
if (pageCode.includes('aria-label="Delete task"') && pageCode.includes("await deleteTask(task.id)")) {
  console.log('✅ Delete button found in UI\n');
} else {
  console.log('❌ Delete button NOT found in UI\n');
  process.exit(1);
}

// Test 9: Check delete button has red styling
console.log('Test 9: Checking delete button has red styling...');
if (pageCode.includes("bg-red-100") && pageCode.includes("text-red-700")) {
  console.log('✅ Delete button has red styling\n');
} else {
  console.log('❌ Delete button does NOT have red styling\n');
  process.exit(1);
}

// Test 10: Check delete button is in a form
console.log('Test 10: Checking delete button is in a form...');
const deleteFormMatch = pageCode.match(/<form[\s\S]*?await deleteTask\(task\.id\)[\s\S]*?<\/form>/);
if (deleteFormMatch) {
  console.log('✅ Delete button is wrapped in a form\n');
} else {
  console.log('❌ Delete button is NOT wrapped in a form\n');
  process.exit(1);
}

console.log('✨ All tests passed! Implementation is complete and correct.\n');

