const supabase = require('../config/supabase');
const { randomUUID } = require('crypto');

const normEmail = (email) =>
  String(email || '').trim().toLowerCase();

async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', normEmail(email))
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function findUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function createUser({
  name,
  email,
  passwordHash,
  phone = '',
  company = ''
}) {
  const user = {
    id: randomUUID(),
    name: String(name).trim(),
    email: normEmail(email),
    password_hash: passwordHash,
    role: 'Advertiser',
    phone,
    company,
    address: '',
    verification: {
      status: 'not_submitted',
      legalName: '',
      gstin: '',
      pan: '',
      document: null,
      submittedAt: null,
      note: ''
    }
  };

  const { data, error } = await supabase
    .from('users')
    .insert(user)
    .select()
    .single();

  if (error) throw error;
  return data;
}

const newId = (prefix) => `${prefix}${randomUUID().slice(0, 8)}`;

module.exports = {
  normEmail,
  findUserByEmail,
  findUserById,
  createUser,
  newId
};
