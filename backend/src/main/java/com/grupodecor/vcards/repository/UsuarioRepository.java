package com.grupodecor.vcards.repository;

import com.grupodecor.vcards.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    Optional<Usuario> findByToken(String token);
    boolean existsByCorreoIgnoreCase(String correo);
    boolean existsByTelefono(String telefono);
}
