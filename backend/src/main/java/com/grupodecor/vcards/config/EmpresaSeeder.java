package com.grupodecor.vcards.config;

import com.grupodecor.vcards.model.Empresa;
import com.grupodecor.vcards.repository.EmpresaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class EmpresaSeeder implements CommandLineRunner {
    private final EmpresaRepository empresas;

    public EmpresaSeeder(EmpresaRepository empresas) {
        this.empresas = empresas;
    }

    @Override
    public void run(String... args) {
        Map<String, String> datos = new LinkedHashMap<>();
        datos.put("Novacasa", "novacasa.png");
        datos.put("Decorceramica", "decorceramica.png");
        datos.put("KLP", "klp.png");
        datos.put("Klipen", "klipen.png");
        datos.put("Kohler", "kohler.png");
        datos.put("Decor Corporativo", "decorceramica_coorporativo.png");

        datos.forEach((nombre, archivo) -> {
            if (!empresas.existsByNombre(nombre)) {
                empresas.save(new Empresa(nombre, cargarLogo(archivo)));
            }
        });
    }

    private byte[] cargarLogo(String archivo) {
        try {
            return new ClassPathResource("seed-logos/" + archivo).getInputStream().readAllBytes();
        } catch (IOException exception) {
            throw new IllegalStateException("No se encontró el logo " + archivo, exception);
        }
    }
}
