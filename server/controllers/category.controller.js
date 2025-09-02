const Category = require('../models/Category');

exports.listCategories = async (_req, res) => {
  try {
    const items = await Category.find({}).sort({ name: 1 }).lean();
    return res.json(items);
  } catch (err) {
    console.error('listCategories error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description = '' } = req.body || {};
    const trimmed = String(name || '').trim();
    if (!trimmed) return res.status(400).json({ error: 'name is required' });

    // Upsert by case-insensitive name
    const existing = await Category.findOne({ name: trimmed }).collation({ locale: 'en', strength: 2 });
    if (existing) {
      return res.status(200).json({ ok: true, id: existing._id, existed: true });
    }

    const doc = await Category.create({ name: trimmed, description });
    return res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('createCategory error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Category already exists' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
};
