package com.grupodecor.vcards.model;

import jakarta.persistence.*;

@Entity
@Table(name = "usuarios")
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String telefono;

    @Column(nullable = false, unique = true)
    private String correo;

    @Column(nullable = false)
    private String area;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    private byte[] foto;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(name = "img_qr")
    private byte[] imgQr;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    protected Usuario() {}

    public Usuario(String nombre, String telefono, String correo, String area,
                   String descripcion, byte[] foto, String token, byte[] imgQr,
                   Empresa empresa) {
        this.nombre = nombre;
        this.telefono = telefono;
        this.correo = correo;
        this.area = area;
        this.descripcion = descripcion;
        this.foto = foto;
        this.token = token;
        this.imgQr = imgQr;
        this.empresa = empresa;
    }

    public Integer getId() { return id; }
    public String getNombre() { return nombre; }
    public String getTelefono() { return telefono; }
    public String getCorreo() { return correo; }
    public String getArea() { return area; }
    public String getDescripcion() { return descripcion; }
    public byte[] getFoto() { return foto; }
    public String getToken() { return token; }
    public byte[] getImgQr() { return imgQr; }
    public Empresa getEmpresa() { return empresa; }
}
