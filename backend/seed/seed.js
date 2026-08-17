/**
 * Seed script — creates demo users, a demo project, tasks and comments.
 * Run with: npm run seed
 */
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

const run = async () => {
  await connectDB();

  console.log('Clearing existing demo data...');
  await Promise.all([
    User.deleteMany({ email: { $regex: '@taskflow.demo$' } }),
    Notification.deleteMany({}),
  ]);

  console.log('Creating demo users...');
  const demoUsers = await User.create([
    { name: 'Vansh Saini', username: 'Vansh', email: 'Vansh@taskflow.demo', password: 'password123', bio: 'Product manager who loves clean Kanban boards.' },
    { name: 'Rohan Mehta', username: 'rohan', email: 'rohan@taskflow.demo', password: 'password123', bio: 'Full-stack developer.' },
    { name: 'Priya Nair', username: 'priya', email: 'priya@taskflow.demo', password: 'password123', bio: 'UI/UX designer.' },
  ]);

  const [Vansh, rohan, priya] = demoUsers;

  console.log('Creating demo project...');
  const project = await Project.create({
    name: 'TaskFlow Launch',
    description: 'Finish the website, onboarding flow, and remaining launch tasks.',
    owner: Vansh._id,
    members: [
      { user: Vansh._id, role: 'Owner' },
      { user: rohan._id, role: 'Admin' },
      { user: priya._id, role: 'Member' },
    ],
  });

  console.log('Creating demo tasks...');
  const tasks = await Task.create([
    { title: 'Set up CI/CD pipeline', description: 'Automate build & deploy for backend and frontend.', project: project._id, createdBy: Vansh._id, assignedTo: rohan._id, status: 'In Progress', priority: 'High', labels: ['devops'], dueDate: new Date(Date.now() + 3 * 86400000) },
    { title: 'Design onboarding screens', description: 'Create Figma flows for first-time user onboarding.', project: project._id, createdBy: Vansh._id, assignedTo: priya._id, status: 'To Do', priority: 'Medium', labels: ['design'], dueDate: new Date(Date.now() + 5 * 86400000) },
    { title: 'Write landing page copy', description: 'Draft hero, features and pricing copy.', project: project._id, createdBy: Vansh._id, assignedTo: Vansh._id, status: 'Backlog', priority: 'Low', labels: ['marketing'] },
    { title: 'Fix drag-and-drop bug on mobile', description: 'Kanban cards jump on touch devices.', project: project._id, createdBy: rohan._id, assignedTo: rohan._id, status: 'Review', priority: 'Urgent', labels: ['bug', 'frontend'], dueDate: new Date(Date.now() - 1 * 86400000) },
    { title: 'Project kickoff meeting notes', description: 'Summarize decisions from the kickoff call.', project: project._id, createdBy: Vansh._id, assignedTo: null, status: 'Completed', priority: 'Low', labels: [] },
  ]);

  console.log('Creating demo comments...');
  await Comment.create([
    { task: tasks[0]._id, user: Vansh._id, content: 'Great progress — can we target staging by Friday?' },
    { task: tasks[0]._id, user: rohan._id, content: 'Yes, pipeline is almost done, just wiring up test coverage.' },
    { task: tasks[3]._id, user: priya._id, content: 'I can repro this on iOS Safari too.' },
  ]);

  console.log('\nSeed complete! Demo login credentials:');
  console.log('  Vansh@taskflow.demo   / password123  (Owner)');
  console.log('  rohan@taskflow.demo / password123  (Admin)');
  console.log('  priya@taskflow.demo / password123  (Member)');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
