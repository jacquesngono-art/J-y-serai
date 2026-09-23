"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CepInput } from "./cep-input"

// Define the steps of the form
const steps = [
  { id: "company", title: "Dados da Empresa" },
  { id: "address", title: "Endereço" },
  { id: "contact", title: "Contato" },
  { id: "representative", title: "Dados do Representante" },
  { id: "review", title: "Revisão" },
]

export default function EnhancedMultiStepForm() {
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

  const handleAddressFound = (address: {
    logradouro: string
    bairro: string
    localidade: string
    uf: string
  }) => {
    updateFields({
      logradouro: address.logradouro,
      bairro: address.bairro,
      municipio: address.localidade,
      estado: address.uf,
    })
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
                      onChange={(e) => {
                        // Format CNPJ as XX.XXX.XXX/XXXX-XX
                        const value = e.target.value.replace(/\D/g, "")
                        if (value.length <= 14) {
                          let formatted = value
                          if (value.length > 2) formatted = formatted.replace(/^(\d{2})/, "$1.")
                          if (value.length > 5) formatted = formatted.replace(/^(\d{2})\.(\d{3})/, "$1.$2.")
                          if (value.length > 8) formatted = formatted.replace(/^(\d{2})\.(\d{3})\.(\d{3})/, "$1.$2.$3/")
                          if (value.length > 12)
                            formatted = formatted.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})/, "$1.$2.$3/$4-")
                          updateFields({ cnpj: formatted })
                        }
                      }}
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
                  <CepInput
                    value={formData.cep}
                    onChange={(value) => updateFields({ cep: value })}
                    onAddressFound={handleAddressFound}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="estado">Estado:</Label>
                      <Select value={formData.estado} onValueChange={(value) => updateFields({ estado: value })}>
                       
                          {/* Add more states as needed */}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="municipio">Município:</Label>
                      <Input
                        id="municipio"
                        value={formData.municipio}
                        onChange={(e) => updateFields({ municipio: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bairro">Bairro:</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) => updateFields({ bairro: e.target.value })}
                      required
                    />
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
                    <Label htmlFor="representanteCnpj">CNPJ/CPF:</Label>
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
                </div>
                <div>
                    <Label htmlFor="representanteCnpj">CNPJ/CPF:</Label>
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
                    <h3 className="font-medium mb-2">Endereço</h3>
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
                      <strong>CNPJ/CPF:</strong> {formData.representanteCnpj}
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
