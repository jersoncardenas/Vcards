package com.grupodecor.vcards.controller;

import com.grupodecor.vcards.dto.PerfilResponse;
import com.grupodecor.vcards.dto.QrResponse;
import com.grupodecor.vcards.dto.TokenResponse;
import com.grupodecor.vcards.service.UsuarioService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
public class UsuarioController {
    private final UsuarioService usuarios;

    public UsuarioController(UsuarioService usuarios) {
        this.usuarios = usuarios;
    }

    @PostMapping(value = "/validar_usuario", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public Map<String, String> validar(@RequestParam String correo, @RequestParam String telefono) {
        usuarios.validarDuplicados(correo, telefono);
        return Map.of("status", "ok");
    }

    @PostMapping(value = "/usuario", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public TokenResponse crear(
            @RequestParam String nombre,
            @RequestParam String area,
            @RequestParam String telefono,
            @RequestParam String correo,
            @RequestParam String descripcion,
            @RequestParam("empresa_id") Integer empresaId,
            @RequestPart("foto") MultipartFile foto
    ) {
        return new TokenResponse(usuarios.crear(
                nombre, area, telefono, correo, descripcion, empresaId, foto
        ));
    }

    @GetMapping("/perfil/{token}")
    public PerfilResponse perfil(@PathVariable String token) {
        return usuarios.obtenerPerfil(token);
    }

    @GetMapping("/obtener_qr/{token}")
    public QrResponse qr(@PathVariable String token) {
        return usuarios.obtenerQr(token);
    }
}
