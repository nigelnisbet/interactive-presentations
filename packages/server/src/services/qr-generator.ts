import QRCode from 'qrcode';
import { config } from '../config';

export class QRGenerator {
  async generateQRCode(sessionCode: string): Promise<string> {
    const joinUrl = `${config.attendeeAppUrl}/join/${sessionCode}`;

    try {
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(joinUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }
}
