"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define the steps of the form
const steps = [
  { id: "company", title: "Dados da Empresa" },
  { id: "address", title: "Endereço" },
  { id: "contact", title: "Contato" },
  { id: "representative", title: "Dados do Representante" },
  { id: "review", title: "Revisão" },
]

export default function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    // Company data
    cnpj: "",
    razaoSocial: "",
    nomeFantasia: "",
    // Address data
    cep: "",
    estado: "",
    municipio: "",
    bairro: "",
    logradouro: "",
    numero: "",
    // Contact data
    email: "",
    inscricaoMunicipal: "",
    // Representative data
    representanteCnpj: "",
    representanteNome: "",
    representanteCep: "",
    representanteEstado: "",
    representanteMunicipio: "",
    representanteBairro: "",
    representanteLogradouro: "",
    representanteNumero: "",
    representanteEmail: "",
    representanteTelefone: "",
  })

  const updateFields = (fields: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...fields }))
  }

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep === steps.length - 1) {
      // Submit the form data
      console.log("Form submitted:", formData)
      // Here you would typically send the data to your API
      alert("Formulário enviado com sucesso!")
    } else {
      nextStep()
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Cadastrar Nova Empresa</CardTitle>
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${index <= currentStep ? "text-primary" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                    index < currentStep
                      ? "bg-primary text-primary-foreground"
                      : index === currentStep
                        ? "border-2 border-primary text-primary"
                        : "border-2 border-muted-foreground text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? "✓" : index + 1}
                </div>
                <span className="text-xs text-center">{step.title}</span>
              </div>
            ))}
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            {currentStep === 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Dados da Empresa</h2>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="cnpj">CNPJ:</Label>
                    <Input
                      id="cnpj"
                      placeholder="XX.XXX.XXX/XXXX-XX"
                      value={formData.cnpj}
                      onChange={(e) => updateFields({ cnpj: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="razaoSocial">Razão Social:</Label>
                    <Input
                      id="razaoSocial"
                      value={formData.razaoSocial}
                      onChange={(e) => updateFields({ razaoSocial: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nomeFantasia">Nome Fantasia:</Label>
                    <Input
                      id="nomeFantasia"
                      value={formData.nomeFantasia}
                      onChange={(e) => updateFields({ nomeFantasia: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Endereço</h2>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="cep">CEP:</Label>
                    <Input
                      id="cep"
                      placeholder="XXXXX-XXX"
                      value={formData.cep}
                      onChange={(e) => updateFields({ cep: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="estado">Estado:</Label>
                      <Select value={formData.estado} onValueChange={(value) => updateFields({ estado: value })}>
                        <SelectTrigger id="estado">
                          <SelectValue placeholder="Selecione um estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sp">São Paulo</SelectItem>
                          <SelectItem value="rj">Rio de Janeiro</SelectItem>
                          <SelectItem value="mg">Minas Gerais</SelectItem>
                          {/* Add more states as needed */}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="municipio">Município:</Label>
                      <Select value={formData.municipio} onValueChange={(value) => updateFields({ municipio: value })}>
                        <SelectTrigger id="municipio">
                          <SelectValue placeholder="Selecione um município" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saopaulo">São Paulo</SelectItem>
                          <SelectItem value="campinas">Campinas</SelectItem>
                          <SelectItem value="santos">Santos</SelectItem>
                          {/* Add more cities as needed */}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bairro">Bairro:</Label>
                    <Select value={formData.bairro} onValueChange={(value) => updateFields({ bairro: value })}>
                      <SelectTrigger id="bairro">
                        <SelectValue placeholder="Selecione um bairro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="centro">Centro</SelectItem>
                        <SelectItem value="jardins">Jardins</SelectItem>
                        <SelectItem value="vilamariana">Vila Mariana</SelectItem>
                        {/* Add more neighborhoods as needed */}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="logradouro">Logradouro:</Label>
                    <Input
                      id="logradouro"
                      value={formData.logradouro}
                      onChange={(e) => updateFields({ logradouro: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="numero">Número:</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => updateFields({ numero: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Contato</h2>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="email">Email:</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFields({ email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="inscricaoMunicipal">Inscrição Municipal:</Label>
                    <Input
                      id="inscricaoMunicipal"
                      value={formData.inscricaoMunicipal}
                      onChange={(e) => updateFields({ inscricaoMunicipal: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Dados do Representante</h2>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="representanteNome">Nome Completo:</Label>
                    <Input
                      id="representanteNome"
                      value={formData.representanteNome}
                      onChange={(e) => updateFields({ representanteNome: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="representanteCnpj">CPF:</Label>
                    <Input
                      id="representanteCnpj"
                      placeholder="XXX.XXX.XXX-XX"
                      value={formData.representanteCnpj}
                      onChange={(e) => {
                        // Format CPF as XXX.XXX.XXX-XX
                        const value = e.target.value.replace(/\D/g, "")
                        if (value.length <= 11) {
                          let formatted = value
                          if (value.length > 3) formatted = formatted.replace(/^(\d{3})/, "$1.")
                          if (value.length > 6) formatted = formatted.replace(/^(\d{3})\.(\d{3})/, "$1.$2.")
                          if (value.length > 9) formatted = formatted.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, "$1.$2.$3-")
                          updateFields({ representanteCnpj: formatted })
                        }
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="representanteEmail">Email:</Label>
                    <Input
                      id="representanteEmail"
                      type="email"
                      value={formData.representanteEmail}
                      onChange={(e) => updateFields({ representanteEmail: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="representanteTelefone">Telefone:</Label>
                    <Input
                      id="representanteTelefone"
                      placeholder="(XX) XXXXX-XXXX"
                      value={formData.representanteTelefone}
                      onChange={(e) => {
                        // Format phone number as (XX) XXXXX-XXXX
                        const value = e.target.value.replace(/\D/g, "")
                        if (value.length <= 11) {
                          let formatted = value
                          if (value.length > 0) formatted = formatted.replace(/^(\d{0,2})/, "($1")
                          if (value.length > 2) formatted = formatted.replace(/^(\(\d{2})/, "$1) ")
                          if (value.length > 7) formatted = formatted.replace(/^($$\d{2}$$ \d{5})/, "$1-")
                          updateFields({ representanteTelefone: formatted })
                        }
                      }}
                      required
                    />
                  </div>

                  <h3 className="text-lg font-medium mt-2">Endereço do Representante</h3>

                  <div>
                    <Label htmlFor="representanteCep">CEP:</Label>
                    <Input
                      id="representanteCep"
                      placeholder="XXXXX-XXX"
                      value={formData.representanteCep}
                      onChange={(e) => {
                        // Format CEP as XXXXX-XXX
                        const value = e.target.value.replace(/\D/g, "")
                        if (value.length <= 8) {
                          let formatted = value
                          if (value.length > 5) formatted = formatted.replace(/^(\d{5})/, "$1-")
                          updateFields({ representanteCep: formatted })
                        }
                      }}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="representanteEstado">Estado:</Label>
                      <Select
                        value={formData.representanteEstado}
                        onValueChange={(value) => updateFields({ representanteEstado: value })}
                      >
                        <SelectTrigger id="representanteEstado">
                          <SelectValue placeholder="Selecione um estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sp">São Paulo</SelectItem>
                          <SelectItem value="rj">Rio de Janeiro</SelectItem>
                          <SelectItem value="mg">Minas Gerais</SelectItem>
                          {/* Add more states as needed */}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="representanteMunicipio">Município:</Label>
                      <Select
                        value={formData.representanteMunicipio}
                        onValueChange={(value) => updateFields({ representanteMunicipio: value })}
                      >
                        <SelectTrigger id="representanteMunicipio">
                          <SelectValue placeholder="Selecione um município" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saopaulo">São Paulo</SelectItem>
                          <SelectItem value="campinas">Campinas</SelectItem>
                          <SelectItem value="santos">Santos</SelectItem>
                          {/* Add more cities as needed */}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="representanteBairro">Bairro:</Label>
                    <Select
                      value={formData.representanteBairro}
                      onValueChange={(value) => updateFields({ representanteBairro: value })}
                    >
                      <SelectTrigger id="representanteBairro">
                        <SelectValue placeholder="Selecione um bairro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="centro">Centro</SelectItem>
                        <SelectItem value="jardins">Jardins</SelectItem>
                        <SelectItem value="vilamariana">Vila Mariana</SelectItem>
                        {/* Add more neighborhoods as needed */}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="representanteLogradouro">Logradouro:</Label>
                    <Input
                      id="representanteLogradouro"
                      value={formData.representanteLogradouro}
                      onChange={(e) => updateFields({ representanteLogradouro: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="representanteNumero">Número:</Label>
                    <Input
                      id="representanteNumero"
                      value={formData.representanteNumero}
                      onChange={(e) => updateFields({ representanteNumero: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Revisão dos Dados</h2>
                <div className="grid gap-6">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Dados da Empresa</h3>
                    <p>
                      <strong>CNPJ:</strong> {formData.cnpj}
                    </p>
                    <p>
                      <strong>Razão Social:</strong> {formData.razaoSocial}
                    </p>
                    <p>
                      <strong>Nome Fantasia:</strong> {formData.nomeFantasia}
                    </p>
                  </div>
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Endereço da Empresa</h3>
                    <p>
                      <strong>CEP:</strong> {formData.cep}
                    </p>
                    <p>
                      <strong>Estado:</strong> {formData.estado}
                    </p>
                    <p>
                      <strong>Município:</strong> {formData.municipio}
                    </p>
                    <p>
                      <strong>Bairro:</strong> {formData.bairro}
                    </p>
                    <p>
                      <strong>Logradouro:</strong> {formData.logradouro}
                    </p>
                    <p>
                      <strong>Número:</strong> {formData.numero}
                    </p>
                  </div>
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Contato</h3>
                    <p>
                      <strong>Email:</strong> {formData.email}
                    </p>
                    <p>
                      <strong>Inscrição Municipal:</strong> {formData.inscricaoMunicipal}
                    </p>
                  </div>
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Dados do Representante</h3>
                    <p>
                      <strong>Nome:</strong> {formData.representanteNome}
                    </p>
                    <p>
                      <strong>CPF:</strong> {formData.representanteCnpj}
                    </p>
                    <p>
                      <strong>Email:</strong> {formData.representanteEmail}
                    </p>
                    <p>
                      <strong>Telefone:</strong> {formData.representanteTelefone}
                    </p>
                    <h4 className="font-medium mt-3 mb-1">Endereço do Representante</h4>
                    <p>
                      <strong>CEP:</strong> {formData.representanteCep}
                    </p>
                    <p>
                      <strong>Estado:</strong> {formData.representanteEstado}
                    </p>
                    <p>
                      <strong>Município:</strong> {formData.representanteMunicipio}
                    </p>
                    <p>
                      <strong>Bairro:</strong> {formData.representanteBairro}
                    </p>
                    <p>
                      <strong>Logradouro:</strong> {formData.representanteLogradouro}
                    </p>
                    <p>
                      <strong>Número:</strong> {formData.representanteNumero}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 0 ? undefined : prevStep}
              disabled={currentStep === 0}
            >
              {currentStep === 0 ? "Cancelar" : "Voltar"}
            </Button>
            <Button type="submit">{currentStep === steps.length - 1 ? "Salvar" : "Próximo"}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
