const Equipment = require('../models/Equipment');

// Create equipment
exports.createEquipment = async (req, res) => {
  try {
    const {
      name,
      category,
      description = '',
  quantity = 1,
      capacity = 1,
  bookingMinutes = 30,
  status = 'operational',
      keyFeatures,
  technicalSpecifications = '',
  usageGuidelines = [],
  safetyRequirements = [],
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'name and category are required' });
    }

    let featuresArray = [];
    if (Array.isArray(keyFeatures)) {
      featuresArray = keyFeatures.filter(Boolean);
    } else if (typeof keyFeatures === 'string' && keyFeatures.trim()) {
      // support comma separated in case frontend sends a string
      featuresArray = keyFeatures
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Normalize guidelines and safety arrays
    const normList = (val) => {
      if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
      if (typeof val === 'string') {
        // split by newline primarily, fallback to comma
        const parts = val.includes('\n') ? val.split(/\r?\n/) : val.split(',');
        return parts.map((s) => s.trim()).filter(Boolean);
      }
      return [];
    };

    // Parse technical specifications
    let technicalSpecsArray = [];
    const toKV = (line) => {
      const [key, ...rest] = String(line || '').split(':');
      return { key: (key || '').trim(), value: rest.join(':').trim() };
    };
    if (Array.isArray(technicalSpecifications)) {
      // Could be array of strings or array of {key, value}
      technicalSpecsArray = technicalSpecifications
        .map((it) => (typeof it === 'string' ? toKV(it) : { key: (it.key || '').trim(), value: String(it.value || '').trim() }))
        .filter((kv) => kv.key);
    } else if (typeof technicalSpecifications === 'string' && technicalSpecifications.trim()) {
      const raw = technicalSpecifications.trim();
      if (raw.startsWith('[')) {
        try {
          const arr = JSON.parse(raw);
          technicalSpecsArray = Array.isArray(arr)
            ? arr
                .map((it) => ({ key: String(it.key || '').trim(), value: String(it.value || '').trim() }))
                .filter((kv) => kv.key)
            : [];
        } catch {
          technicalSpecsArray = [];
        }
      } else {
        technicalSpecsArray = raw
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map(toKV)
          .filter((kv) => kv.key);
      }
    }

    const doc = new Equipment({
      name,
      category,
      description,
  quantity: Number(quantity) || 1,
      capacity: Number(capacity) || 1,
      bookingMinutes: Number(bookingMinutes) || 30,
      status: ['operational', 'maintenance'].includes(status) ? status : 'operational',
      keyFeatures: featuresArray,
      technicalSpecifications: technicalSpecsArray,
      usageGuidelines: normList(usageGuidelines),
      safetyRequirements: normList(safetyRequirements),
    });

    if (req.file) {
      doc.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    const saved = await doc.save();
    return res.status(201).json({ message: 'Equipment added successfully', equipmentId: saved._id });
  } catch (err) {
    console.error('Create equipment error:', err);
    return res.status(500).json({ error: 'Validation or server error' });
  }
};

// List equipment (exclude image data)
exports.listEquipment = async (_req, res) => {
  try {
    const items = await Equipment.find({}, {
      image: 0,
    })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(items);
  } catch (err) {
    console.error('List equipment error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Get one equipment (exclude image data)
exports.getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Equipment.findById(id, { image: 0 }).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    return res.json(item);
  } catch (err) {
    console.error('Get equipment error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Get equipment image
exports.getEquipmentImage = async (req, res) => {
  try {
    const { id } = req.params;
    const eq = await Equipment.findById(id, { image: 1 });
    if (!eq || !eq.image || !eq.image.data) return res.status(404).send('Not found');
    res.set('Content-Type', eq.image.contentType || 'image/jpeg');
    return res.send(eq.image.data);
  } catch (err) {
    console.error('Get image error:', err);
    return res.status(500).send('Server error');
  }
};
