package com.grupodecor.vcards.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;

@Service
public class QrService {
    public byte[] generar(String url, byte[] logoBytes) {
        try {
            Map<EncodeHintType, Object> hints = Map.of(
                    EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H,
                    EncodeHintType.MARGIN, 2
            );
            BitMatrix matrix = new QRCodeWriter().encode(url, BarcodeFormat.QR_CODE, 700, 700, hints);
            BufferedImage qr = MatrixToImageWriter.toBufferedImage(matrix);

            if (logoBytes != null && logoBytes.length > 0) {
                BufferedImage logo = ImageIO.read(new ByteArrayInputStream(logoBytes));
                if (logo != null) {
                    int size = qr.getWidth() / 4;
                    Image scaledLogo = logo.getScaledInstance(size, size, Image.SCALE_SMOOTH);
                    Graphics2D graphics = qr.createGraphics();
                    int x = (qr.getWidth() - size) / 2;
                    int y = (qr.getHeight() - size) / 2;
                    graphics.setColor(Color.WHITE);
                    graphics.fillRoundRect(x - 10, y - 10, size + 20, size + 20, 20, 20);
                    graphics.drawImage(scaledLogo, x, y, null);
                    graphics.dispose();
                }
            }

            ByteArrayOutputStream output = new ByteArrayOutputStream();
            ImageIO.write(qr, "PNG", output);
            return output.toByteArray();
        } catch (WriterException | IOException exception) {
            throw new IllegalStateException("No fue posible generar el código QR", exception);
        }
    }
}
