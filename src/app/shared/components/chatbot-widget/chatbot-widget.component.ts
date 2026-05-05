import { Component, signal, inject, effect, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { ChatbotService } from '../../services/chatbot.service';
import { ChatMessage } from '../../models/chatbot.model';

type AIProvider = 'deepseek' | 'chatgpt' | 'gemini';

interface AIModel {
  id: string;
  provider: AIProvider;
  name: string;
  description: string;
  category: string;
  available: boolean;
  recommended?: boolean;
}

@Component({
  selector: 'app-chatbot-widget',
  imports: [CommonModule, FormsModule, MarkdownModule],
  templateUrl: './chatbot-widget.component.html',
  styleUrl: './chatbot-widget.component.css'
})
export class ChatbotWidgetComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;
  @ViewChild('fileInput') private fileInput?: ElementRef;

  private chatbotService = inject(ChatbotService);

  isOpen = signal(false);
  messages = signal<ChatMessage[]>([]);
  messageText = signal('');
  isLoading = signal(false);
  sessionId = signal('');
  selectedFiles = signal<File[]>([]);
  showModelSelector = signal(false);
  selectedModelId = signal<string>('gemini-3-flash-preview');
  modelSearchText = signal('');
  private shouldScrollToBottom = false;

  aiModels: AIModel[] = [
    {
      id: 'gemini-3.1-pro-preview',
      provider: 'gemini',
      name: 'Gemini 3.1 Pro Preview',
      description: 'Última versão - Mais avançado',
      category: 'Google',
      available: true,
      recommended: true
    },
    {
      id: 'gemini-3-flash-preview',
      provider: 'gemini',
      name: 'Gemini 3 Flash Preview',
      description: 'Nova versão - Ultra rápido',
      category: 'Google',
      available: true,
      recommended: true
    },
    {
      id: 'gemini-3.1-flash-lite-preview',
      provider: 'gemini',
      name: 'Gemini 3.1 Flash Lite Preview',
      description: 'Versão leve e econômica',
      category: 'Google',
      available: true
    },
    {
      id: 'gemini-1.5-flash',
      provider: 'gemini',
      name: 'Gemini 1.5 Flash',
      description: 'Versão anterior - Estável',
      category: 'Google',
      available: true
    },
    {
      id: 'gemini-1.5-pro',
      provider: 'gemini',
      name: 'Gemini 1.5 Pro',
      description: 'Versão anterior - Poderoso',
      category: 'Google',
      available: true
    },
    {
      id: 'gemini-pro',
      provider: 'gemini',
      name: 'Gemini Pro',
      description: 'Versão clássica',
      category: 'Google',
      available: true
    }
  ];

  get filteredModels() {
    const search = this.modelSearchText().toLowerCase();
    if (!search) return this.aiModels;

    return this.aiModels.filter(model =>
      model.name.toLowerCase().includes(search) ||
      model.description.toLowerCase().includes(search) ||
      model.category.toLowerCase().includes(search)
    );
  }

  get currentModel(): AIModel | undefined {
    return this.aiModels.find(m => m.id === this.selectedModelId());
  }

  get currentModelName(): string {
    return this.currentModel?.name || 'Gemini 3 Flash Preview';
  }

  get currentProvider(): AIProvider {
    return this.currentModel?.provider || 'deepseek';
  }

  constructor() {
    effect(() => {
      if (this.isOpen() && !this.sessionId()) {
        const storedSessionId = localStorage.getItem('chatbot_session_id');
        if (storedSessionId) {
          this.sessionId.set(storedSessionId);
          this.carregarHistorico();
        } else {
          const newSessionId = this.chatbotService.gerarSessionId();
          this.sessionId.set(newSessionId);
          localStorage.setItem('chatbot_session_id', newSessionId);
          this.adicionarMensagemBemVindo();
        }
      }
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  toggleChat() {
    this.isOpen.update(value => !value);
  }

  closeChat() {
    this.isOpen.set(false);
  }

  enviarMensagem() {
    const texto = this.messageText().trim();
    const arquivos = this.selectedFiles();

    if (!texto && arquivos.length === 0) {
      return;
    }

    this.isLoading.set(true);

    this.chatbotService.enviarMensagem({
      sessionId: this.sessionId(),
      message: texto || 'Arquivo anexado',
      files: arquivos,
      provider: this.currentProvider,
      model: this.selectedModelId()
    }).subscribe({
      next: (response) => {
        if (response.success && response.data?.message) {
          this.carregarHistorico();
          this.messageText.set('');
          this.selectedFiles.set([]);
          if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
          }
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao enviar mensagem:', error);
        this.adicionarMensagemErro('Desculpe, ocorreu um erro ao enviar sua mensagem. Tente novamente.');
        this.isLoading.set(false);
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const newFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(input.files).forEach(file => {
      if (this.chatbotService.validarTipoArquivo(file)) {
        if (file.size <= 10 * 1024 * 1024) {
          newFiles.push(file);
        } else {
          invalidFiles.push(`${file.name} (arquivo muito grande, máximo 10MB)`);
        }
      } else {
        invalidFiles.push(`${file.name} (tipo não permitido)`);
      }
    });

    if (invalidFiles.length > 0) {
      alert(`Alguns arquivos não puderam ser adicionados:\n${invalidFiles.join('\n')}`);
    }

    const currentFiles = this.selectedFiles();
    const allFiles = [...currentFiles, ...newFiles];

    if (allFiles.length > 5) {
      alert('Máximo de 5 arquivos permitidos');
      this.selectedFiles.set(allFiles.slice(0, 5));
    } else {
      this.selectedFiles.set(allFiles);
    }
  }

  removerArquivo(index: number) {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
  }

  formatarTamanho(bytes: number): string {
    return this.chatbotService.formatarTamanhoArquivo(bytes);
  }

  limparHistorico() {
    if (!confirm('Tem certeza que deseja limpar todo o histórico desta conversa?')) {
      return;
    }

    this.chatbotService.limparHistorico(this.sessionId()).subscribe({
      next: (response) => {
        if (response.success) {
          this.messages.set([]);
          this.adicionarMensagemBemVindo();
        }
      },
      error: (error) => {
        console.error('Erro ao limpar histórico:', error);
        alert('Erro ao limpar histórico. Tente novamente.');
      }
    });
  }

  private carregarHistorico() {
    this.chatbotService.obterHistorico(this.sessionId(), 50).subscribe({
      next: (response) => {
        if (response.success && response.data?.messages) {
          this.messages.set(response.data.messages);
          this.shouldScrollToBottom = true;
        }
      },
      error: (error) => {
        console.error('Erro ao carregar histórico:', error);
      }
    });
  }

  private adicionarMensagemBemVindo() {
    const mensagemBemVindo: ChatMessage = {
      sessionId: this.sessionId(),
      role: 'assistant',
      content: 'Olá! 👋 Sou seu assistente financeiro, powered by **Google Gemini**.\n\nEstou aqui para ajudar você a **consultar e analisar** suas finanças!\n\n**O que posso fazer:**\n- 📊 Analisar suas despesas e receitas\n- 💡 Identificar padrões de gastos\n- 📈 Mostrar tendências financeiras\n- 🔍 Responder perguntas sobre seus dados\n- 💰 Calcular saldos e totais\n\n**Observação:** Sou apenas para consultas. Para cadastrar, editar ou deletar dados, use a interface principal do app.',
      createdAt: new Date()
    };
    this.messages.set([mensagemBemVindo]);
    this.shouldScrollToBottom = true;
  }

  private adicionarMensagemErro(texto: string) {
    const mensagemErro: ChatMessage = {
      sessionId: this.sessionId(),
      role: 'assistant',
      content: texto,
      createdAt: new Date()
    };
    this.messages.update(msgs => [...msgs, mensagemErro]);
    this.shouldScrollToBottom = true;
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      try {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Erro ao fazer scroll:', err);
      }
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensagem();
    }
  }

  toggleModelSelector() {
    this.showModelSelector.update(value => !value);
    this.modelSearchText.set('');
  }

  closeModelSelector() {
    this.showModelSelector.set(false);
    this.modelSearchText.set('');
  }

  selectModel(modelId: string) {
    const model = this.aiModels.find(m => m.id === modelId);
    if (model && !model.available) {
      alert(`${model.name} ainda não está disponível. Por favor, escolha outro modelo Gemini.`);
      return;
    }

    this.selectedModelId.set(modelId);
    this.closeModelSelector();
  }

  triggerFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }
}
