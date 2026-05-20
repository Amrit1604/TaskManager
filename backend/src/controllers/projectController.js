/**
 * controllers/projectController.js
 */
const ProjectModel = require('../models/projectModel');
const UserModel = require('../models/userModel');

const ProjectController = {
  /** GET /projects */
  async list(req, res, next) {
    try {
      const projects = await ProjectModel.findAllForUser(req.user.id, req.user.role);
      res.json({ projects });
    } catch (err) {
      next(err);
    }
  },

  /** GET /projects/:id */
  async get(req, res, next) {
    try {
      const project = await ProjectModel.findById(req.params.id);
      if (!project) return res.status(404).json({ error: true, message: 'Project not found' });

      // Members can only view projects they belong to
      if (req.user.role === 'member') {
        const isMember = await ProjectModel.isMember(project.id, req.user.id);
        if (!isMember) return res.status(403).json({ error: true, message: 'You are not a member of this project' });
      }

      const members = await ProjectModel.getMembers(project.id);
      res.json({ project: { ...project, members } });
    } catch (err) {
      next(err);
    }
  },

  /** POST /projects — admin only */
  async create(req, res, next) {
    try {
      const { name, description } = req.body;
      const project = await ProjectModel.create({ name, description, created_by: req.user.id });

      // Creator is automatically added as a member
      await ProjectModel.addMember(project.id, req.user.id);

      res.status(201).json({ message: 'Project created', project });
    } catch (err) {
      next(err);
    }
  },

  /** PUT /projects/:id — admin only */
  async update(req, res, next) {
    try {
      const project = await ProjectModel.findById(req.params.id);
      if (!project) return res.status(404).json({ error: true, message: 'Project not found' });

      const updated = await ProjectModel.update(req.params.id, req.body);
      res.json({ message: 'Project updated', project: updated });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /projects/:id — admin only (soft delete) */
  async remove(req, res, next) {
    try {
      const project = await ProjectModel.findById(req.params.id);
      if (!project) return res.status(404).json({ error: true, message: 'Project not found' });

      await ProjectModel.softDelete(req.params.id);
      res.json({ message: 'Project deleted' });
    } catch (err) {
      next(err);
    }
  },

  /** POST /projects/:id/members — admin only */
  async addMember(req, res, next) {
    try {
      const project = await ProjectModel.findById(req.params.id);
      if (!project) return res.status(404).json({ error: true, message: 'Project not found' });

      const user = await UserModel.findById(req.body.userId);
      if (!user) return res.status(404).json({ error: true, message: 'User not found' });

      await ProjectModel.addMember(req.params.id, req.body.userId);
      res.json({ message: `${user.name} added to project` });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /projects/:id/members/:userId — admin only */
  async removeMember(req, res, next) {
    try {
      await ProjectModel.removeMember(req.params.id, req.params.userId);
      res.json({ message: 'Member removed from project' });
    } catch (err) {
      next(err);
    }
  },

  /** GET /users — list all users (for member picker in frontend) */
  async listUsers(req, res, next) {
    try {
      const users = await UserModel.findAll();
      res.json({ users });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ProjectController;
