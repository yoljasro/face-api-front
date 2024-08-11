import { NextApiRequest, NextApiResponse } from 'next';

const users = [
  { name  : "Behzod " , imageUrl : "/uploads/behzod.jpg"},
  { name  : "Jasur " , imageUrl : "/uploads/jasur.jpg"},
  { name  : "Aziz Manapov " , imageUrl : "/uploads/Aziz.jpg"},
  { name  : "Shuhratjon SaitMuradov " , imageUrl : "/uploads/shuhratjon.jpg"},
  // Yana foydalanuvchilar qo'shishingiz mumkin
];

export default (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json(users);
};
