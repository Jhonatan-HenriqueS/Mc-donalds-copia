export const formatCpf = (cpf: string): string => {
  // Remove caracteres não numéricos
  const cleaned = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos
  if (cleaned.length !== 11) {
    return cpf; // Retorna o CPF original se não tiver 11 dígitos
  }

  // Formata como ###.###.###-##
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};
