package com.grupodecor.vcards.controller;

import com.grupodecor.vcards.dto.EmpresaResponse;
import com.grupodecor.vcards.exception.ResourceNotFoundException;
import com.grupodecor.vcards.model.Empresa;
import com.grupodecor.vcards.repository.EmpresaRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.Base64;
import java.util.List;

@RestController
public class EmpresaController {
    private final EmpresaRepository empresas;

    public EmpresaController(EmpresaRepository empresas) {
        this.empresas = empresas;
    }

    @GetMapping("/empresas")
    public List<EmpresaResponse> listar() {
        return empresas.findAll().stream().map(this::respuesta).toList();
    }

    @GetMapping("/formulario/{empresaId}")
    public EmpresaResponse formulario(@PathVariable Integer empresaId) {
        return empresas.findById(empresaId)
                .map(this::respuesta)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa no encontrada"));
    }

    private EmpresaResponse respuesta(Empresa empresa) {
        String logo = empresa.getFoto() == null
                ? null
                : Base64.getEncoder().encodeToString(empresa.getFoto());
        return new EmpresaResponse(empresa.getId(), empresa.getNombre(), logo);
    }
}
