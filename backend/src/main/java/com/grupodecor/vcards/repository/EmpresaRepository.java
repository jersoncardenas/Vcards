package com.grupodecor.vcards.repository;

import com.grupodecor.vcards.model.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmpresaRepository extends JpaRepository<Empresa, Integer> {
    boolean existsByNombre(String nombre);
}
