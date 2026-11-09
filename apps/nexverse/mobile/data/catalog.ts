export type Story = {
  id: string;
  title: string;
  author: string;
  genre: string;
  synopsis: string;
  cover: string;
  chapters: number;
  reads: string;
  status: 'Ongoing' | 'Completed';
  featured?: boolean;
};

export const stories: Story[] = [
  {
    id: 'senja-di-ujung-kota',
    title: 'Senja di Ujung Kota',
    author: 'Alya Pramesti',
    genre: 'Romance',
    synopsis: 'Dua orang asing bertemu di kota yang sama-sama ingin mereka tinggalkan. Di antara hujan, kedai kecil, dan percakapan yang tertunda, mereka belajar bahwa pulang tidak selalu berarti kembali ke tempat yang sama.',
    cover: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=900&q=85',
    chapters: 28,
    reads: '128K',
    status: 'Ongoing',
    featured: true
  },
  {
    id: 'arsip-bintang',
    title: 'Arsip Bintang',
    author: 'Raka Mahendra',
    genre: 'Fantasy',
    synopsis: 'Seorang penjaga perpustakaan menemukan katalog yang mencatat masa depan setiap orang. Satu nama di dalamnya seharusnya tidak pernah ada.',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&q=85',
    chapters: 42,
    reads: '86K',
    status: 'Completed'
  },
  {
    id: 'rumah-yang-kita-cari',
    title: 'Rumah yang Kita Cari',
    author: 'Nadia Kirana',
    genre: 'Drama',
    synopsis: 'Setelah bertahun-tahun merantau, tiga saudara pulang untuk menjual rumah masa kecil dan menemukan rahasia yang mengubah cara mereka memandang keluarga.',
    cover: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=900&q=85',
    chapters: 19,
    reads: '54K',
    status: 'Ongoing'
  },
  {
    id: 'kode-terakhir',
    title: 'Kode Terakhir',
    author: 'Dimas Ardi',
    genre: 'Thriller',
    synopsis: 'Sebuah pesan terenkripsi muncul di ponsel seorang jurnalis. Setiap petunjuk membawanya lebih dekat pada kasus yang sengaja dihapus dari sejarah.',
    cover: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=900&q=85',
    chapters: 16,
    reads: '39K',
    status: 'Ongoing'
  }
];

export const genres = ['Semua', 'Romance', 'Fantasy', 'Drama', 'Thriller', 'Mystery', 'Slice of Life'];