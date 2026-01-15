import { pipeline } from '@xenova/transformers';

class AIModel {
  static instance = null;

  static async getInstance() {
    if (!this.instance) {
      console.log('🔄 Loading AI Model (this may take a moment)...');
      // Menggunakan model yang kecil tapi powerful untuk semantic search
      this.instance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('✅ AI Model Loaded!');
    }
    return this.instance;
  }

  static async generateEmbedding(text) {
    const extractor = await this.getInstance();
    
    // Potong text jika terlalu panjang (model limit biasanya 512 token)
    // Kita ambil ~500 karakter pertama + tengah untuk konteks, atau cukup 800 char pertama
    const truncatedText = text.substring(0, 800);
    
    const output = await extractor(truncatedText, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }
}

export default AIModel;
