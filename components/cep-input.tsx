"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface CepInputProps {
  value: string
  onChange: (value: string) => void
  onAddressFound?: (address: {
    logradouro: string
    bairro: string
    localidade: string
    uf: string
  }) => void
}

export function CepInput({ value, onChange, onAddressFound }: CepInputProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, "")

    // Format as XXXXX-XXX
    if (newValue.length <= 5) {
      onChange(newValue)
    } else {
      onChange(`${newValue.slice(0, 5)}-${newValue.slice(5, 8)}`)
    }

    setError("")
  }

  const searchCep = async () => {
    if (value.replace(/\D/g, "").length !== 8) {
      setError("CEP inválido")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`https://viacep.com.br/ws/${value.replace(/\D/g, "")}/json/`)
      const data = await response.json()

      if (data.erro) {
        setError("CEP não encontrado")
        return
      }

      if (onAddressFound) {
        onAddressFound({
          logradouro: data.logradouro,
          bairro: data.bairro,
          localidade: data.localidade,
          uf: data.uf,
          estado: data.estado,
        })
      }
    } catch (error) {
      setError("Erro ao buscar CEP")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="cep">CEP:</Label>
      <div className="flex gap-2">
        <Input
          id="cep"
          placeholder="XXXXX-XXX"
          value={value}
          onChange={handleChange}
          maxLength={9}
          className={error ? "border-red-500" : ""}
        />
        <Button
          type="button"
          variant="outline"
          onClick={searchCep}
          disabled={isLoading || value.replace(/\D/g, "").length !== 8}
        >
          {isLoading ? "Buscando..." : "Buscar"}
        </Button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
