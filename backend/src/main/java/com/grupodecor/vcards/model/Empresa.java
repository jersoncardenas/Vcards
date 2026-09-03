package com.grupodecor.vcards.model;

import jakarta.persistence.*;

@Entity
@Table(name = "empresas")
public class Empresa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String nombre;

    @Column(name = "foto")
    private byte[] foto;

    protected Empresa() {}

    public Empresa(String nombre, byte[] foto) {
        this.nombre = nombre;
        this.foto = foto;
    }

    public Integer getId() { return id; }
    public String getNombre() { return nombre; }
    public byte[] getFoto() { return foto; }
}
