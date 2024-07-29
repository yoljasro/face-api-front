import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';

const upload = multer({
  storage: multer.diskStorage({
    destination: '/uploads',
    filename: (req, file, cb) => {
      cb(null, `${req.body.name}${path.extname(file.originalname)}`);
    },
  }),
});

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  upload.single('image')(req as any, {} as any, (err) => {
    if (err) {
      res.status(500).json({ error: 'Upload failed' });
      return;
    }

    // Here you can save the user info in a database if needed
    res.status(200).json({ message: 'Upload successful' });
  });
};

export default handler;

export const config = {
  api: {
    bodyParser: false,
  },
};
