import { NextApiRequest, NextApiResponse } from 'next';

const users = [
  { name: "Behzod ", imageUrl: "/uploads/behzod.jpg" },
  { name: "Jasur", imageUrl: "/uploads/jasur.jpg" },
  { name: "Aziz Manapov ", imageUrl: "/uploads/Aziz.jpg" },
  { name: "Shuhratjon SaitMuradov ", imageUrl: "/uploads/shuhratjon.jpg" },
  { name: "Shahnoza ", imageUrl: "/uploads/one.jpg" },
  { name: "Yusuf ", imageUrl: "/uploads/two.jpg" },
  { name: "Shuhrat ", imageUrl: "/uploads/three.jpg" },
  { name: "Elbek ", imageUrl: "/uploads/four.jpg" },
  { name: "Anvar ", imageUrl: "/uploads/anvar.jpg" },
  { name: "Olya", imageUrl: "/uploads/olya.jpg" },
  { name: "Bobur ", imageUrl: "/uploads/five.jpg" },
  { name: "Diana ", imageUrl: "/uploads/six.jpg" },
  { name: "Svetlana ", imageUrl: "/uploads/svetlanaorg.jpg" },
                                                                                                                                                                                                                        

];

export default (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json(users);
};
