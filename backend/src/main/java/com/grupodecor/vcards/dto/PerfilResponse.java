package com.grupodecor.vcards.dto;

public record PerfilResponse(
        String nombre,
        String area,
        String telefono,
        String correo,
        String descripcion,
        String foto_base64,
        String logo_base64,
        String nombre_empresa,
        Integer id_empresa
) {}
