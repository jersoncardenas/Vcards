package com.grupodecor.vcards.service;

import com.grupodecor.vcards.dto.PerfilResponse;
import com.grupodecor.vcards.dto.QrResponse;
import com.grupodecor.vcards.exception.ResourceNotFoundException;
import com.grupodecor.vcards.model.Empresa;
import com.grupodecor.vcards.model.Usuario;
import com.grupodecor.vcards.repository.EmpresaRepository;
import com.grupodecor.vcards.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.UUID;

@Service
public class UsuarioService {
    private final UsuarioRepository usuarios;
    private final EmpresaRepository empresas;
    private final QrService qrService;
    private final String frontendUrl;

    public UsuarioService(UsuarioRepository usuarios,
                          EmpresaRepository empresas,
                          QrService qrService,
                          @Value("${app.frontend-url:http://localhost:4321}") String frontendUrl) {
        this.usuarios = usuarios;
        this.empresas = empresas;
        this.qrService = qrService;
        this.frontendUrl = frontendUrl;
    }

    public void validarDuplicados(String correo, String telefono, Integer empresaId) {
        if (usuarios.existsByCorreoIgnoreCaseAndEmpresa_Id(correo.trim(), empresaId)) {
            throw new IllegalArgumentException("El correo ya está registrado en esta empresa");
        }
        if (usuarios.existsByTelefonoAndEmpresa_Id(telefono.trim(), empresaId)) {
            throw new IllegalArgumentException("El teléfono ya está registrado en esta empresa");
        }
    }

    @Transactional
    public String crear(String nombre, String area, String telefono, String correo,
                        String descripcion, Integer empresaId, MultipartFile foto) {
        validarCampos(nombre, area, telefono, correo, descripcion, foto);
        validarDuplicados(correo, telefono, empresaId);

        Empresa empresa = empresas.findById(empresaId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa no encontrada"));
        String token = UUID.randomUUID().toString().replace("-", "");
        String perfilUrl = frontendUrl + "/perfil/" + token;

        try {
            byte[] qr = qrService.generar(perfilUrl, empresa.getFoto());
            Usuario usuario = new Usuario(
                    nombre.trim(), telefono.trim(), correo.trim().toLowerCase(), area.trim(),
                    descripcion.trim(), foto.getBytes(), token, qr, empresa
            );
            usuarios.save(usuario);
            return token;
        } catch (IOException exception) {
            throw new IllegalArgumentException("No fue posible procesar la imagen");
        }
    }

    @Transactional(readOnly = true)
    public PerfilResponse obtenerPerfil(String token) {
        Usuario usuario = buscarPorToken(token);
        Empresa empresa = usuario.getEmpresa();
        return new PerfilResponse(
                usuario.getNombre(), usuario.getArea(), usuario.getTelefono(), usuario.getCorreo(),
                usuario.getDescripcion(), base64(usuario.getFoto()), base64(empresa.getFoto()),
                empresa.getNombre(), empresa.getId()
        );
    }

    @Transactional(readOnly = true)
    public QrResponse obtenerQr(String token) {
        Usuario usuario = buscarPorToken(token);
        if (usuario.getImgQr() == null || usuario.getImgQr().length == 0) {
            throw new ResourceNotFoundException("QR no disponible");
        }
        return new QrResponse(usuario.getNombre(), base64(usuario.getImgQr()));
    }

    private Usuario buscarPorToken(String token) {
        return usuarios.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private void validarCampos(String nombre, String area, String telefono, String correo,
                               String descripcion, MultipartFile foto) {
        if (nombre == null || nombre.isBlank() || area == null || area.isBlank()
                || descripcion == null || descripcion.isBlank()) {
            throw new IllegalArgumentException("Todos los campos son obligatorios");
        }
        if (telefono == null || !telefono.matches("\\d{10}")) {
            throw new IllegalArgumentException("El teléfono debe tener exactamente 10 dígitos");
        }
        if (correo == null || !correo.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("El correo no tiene un formato válido");
        }
        if (foto == null || foto.isEmpty() || foto.getContentType() == null
                || !foto.getContentType().matches("image/(jpeg|png|webp)")) {
            throw new IllegalArgumentException("La foto debe ser JPG, PNG o WEBP");
        }
    }

    private String base64(byte[] bytes) {
        return bytes == null ? null : Base64.getEncoder().encodeToString(bytes);
    }
}
