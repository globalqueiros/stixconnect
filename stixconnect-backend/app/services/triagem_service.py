from app.models.models import ClassificacaoUrgencia

class TriagemService:
    @staticmethod
    def classificar_urgencia(sintomas: str, dor_escala: int = None, temperatura: str = None, saturacao_oxigenio: str = None) -> ClassificacaoUrgencia:
        sintomas_lower = sintomas.lower()
        pontos = 0
        sintomas_criticos = ["dor no peito", "falta de ar severa", "perda de consciência", "convulsão", "hemorragia", "acidente", "trauma grave", "avc", "derrame", "infarto"]
        sintomas_altos = ["febre alta", "vomito persistente", "diarreia severa", "dificuldade respiratoria", "dor intensa", "confusão mental"]
        for sintoma in sintomas_criticos:
            if sintoma in sintomas_lower:
                return ClassificacaoUrgencia.CRITICA
        if temperatura:
            try:
                temp = float(temperatura.replace(",", "."))
                if temp >= 39.5 or temp <= 35.0:
                    pontos += 3
                elif temp >= 38.5:
                    pontos += 2
            except:
                pass
        if saturacao_oxigenio:
            try:
                sat = int(saturacao_oxigenio.replace("%", ""))
                if sat < 90:
                    return ClassificacaoUrgencia.CRITICA
                elif sat < 95:
                    pontos += 2
            except:
                pass
        if dor_escala:
            if dor_escala >= 8:
                pontos += 3
            elif dor_escala >= 6:
                pontos += 2
        for sintoma in sintomas_altos:
            if sintoma in sintomas_lower:
                pontos += 2
        if pontos >= 5:
            return ClassificacaoUrgencia.CRITICA
        elif pontos >= 3:
            return ClassificacaoUrgencia.ALTA
        elif pontos >= 1:
            return ClassificacaoUrgencia.MEDIA
        else:
            return ClassificacaoUrgencia.BAIXA

triagem_service = TriagemService()