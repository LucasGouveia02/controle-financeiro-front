import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface Expense {
  id: number;
  nome: string;
  descricao: string;
  valor: number;
  grupoGastos: GrupoGastos;
  dataFim: string | null;
  dataInicio: string;
  parcela: string;
}

interface GroupedExpenses {
  [grupoGastos: string]: Expense[];
}

interface TotalByCategory {
  [grupoGastos: string]: number;
}

interface GrupoGastos {
  id: number;
  nome: string;
}

@Component({
  selector: 'app-expense-manager',
  templateUrl: './expense-manager.component.html',
  styleUrls: ['./expense-manager.component.css'],
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule]
})
export class ExpenseManagerComponent implements OnInit {
  expenses: Expense[] = [];
  groupedExpenses: GroupedExpenses = {};
  totalByCategory: TotalByCategory = {};
  grandTotal: number = 0;
  selectedMonth: string = '';
  selectedYear: number = 0;
  isEditModalOpen: boolean = false;
  isNewExpenseModalOpen: boolean = false;
  isNewGroupExpenseModalOpen: boolean = false;
  isSuccessModalOpen: boolean = false;
  isErrorModalOpen: boolean = false;
  newExpense: Expense = { id: 0, nome: '', descricao: '', valor: 0, grupoGastos: {id : 0, nome: ''}, dataFim: null, dataInicio: '', parcela: '' };
  newGroupExpense: GrupoGastos = { id: 0, nome: '' };
  errorMessage: string = '';
  successMessage: string = '';
  selectedExpense: Expense | null = null;
  gruposGastos: { id: number, nome: string }[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit() {
    const currentDate = new Date();
    this.selectedMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    this.selectedYear = currentDate.getFullYear();
    this.fetchExpenses(this.selectedMonth, this.selectedYear);
    this.fetchGruposGastos();
  }

  fetchExpenses(month: string, year: number) {
    const url = `http://localhost:8080/gastos/listar/${month}-${year}`;
    this.http.get<Expense[]>(url)
      .pipe(
        catchError(error => {
          console.error('Error fetching expenses:', error);
          return throwError(error);
        })
      )
      .subscribe(data => {
        this.expenses = data;
        this.groupExpenses();
      });
  }

  fetchGruposGastos() {
    const url = 'http://localhost:8080/grupo-gastos/listar';
    this.http.get<{ id: number, nome: string }[]>(url)
      .pipe(
        catchError(error => {
          console.error('Error fetching grupos de gastos:', error);
          return throwError(error);
        })
      )
      .subscribe(data => {
        this.gruposGastos = data;
      });
  }

  getGroupedExpenseKeys(): string[] {
    return Object.keys(this.groupedExpenses);
  }

  groupExpenses() {
    this.groupedExpenses = this.expenses.reduce((acc: GroupedExpenses, expense: Expense) => {
      const groupName = expense.grupoGastos.nome;
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(expense);
      return acc;
    }, {});
  
    this.calculateTotals();
  }

  calculateTotals() {
    this.totalByCategory = {};
    this.grandTotal = 0;

    for (const grupoGastos in this.groupedExpenses) {
      this.totalByCategory[grupoGastos] = this.groupedExpenses[grupoGastos].reduce((sum, expense) => sum + expense.valor, 0);
      this.grandTotal += this.totalByCategory[grupoGastos];
    }
  }

  onMonthChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const [year, month] = target.value.split('-');
    this.selectedMonth = month;
    this.selectedYear = parseInt(year, 10);
    this.fetchExpenses(this.selectedMonth, this.selectedYear);
  }


  updateExpense() {
    if (this.selectedExpense) {
      const url = `http://localhost:8080/gastos/atualizar/${this.selectedExpense.id}`;
      const expenseToUpdate = {
        ...this.selectedExpense,
        grupoGastosId: this.selectedExpense.grupoGastos.id,
        dataFim: this.selectedExpense.dataFim === "" ? null : this.selectedExpense.dataFim
      };
      this.http.put(url, expenseToUpdate)
        .pipe(
          catchError(error => {
            console.error('Error updating expense:', error);
            this.errorMessage = error.error.message || 'Erro ao atualizar a despesa';
            this.isErrorModalOpen = true;
            return throwError(error);
          })
        )
        .subscribe(() => {
          this.fetchExpenses(this.selectedMonth, this.selectedYear);
          this.successMessage = 'Despesa atualizada com sucesso';
          this.isSuccessModalOpen = true;
          this.closeEditModal();
        });
    }
  }

  addNewExpense() {
    const url = 'http://localhost:8080/gastos/cadastrar';
    const expenseToSave = {
      ...this.newExpense,
      grupoGastosId: this.newExpense.grupoGastos.id,
      dataFim: this.newExpense.dataFim === "0" || this.newExpense.dataFim === "" ? null : this.newExpense.dataFim
    };
    this.http.post(url, expenseToSave)
      .pipe(
        catchError(error => {
          console.error('Error adding expense:', error);
          this.errorMessage = error.error.message || 'Erro ao cadastrar a despesa';
          this.isErrorModalOpen = true;
          return throwError(error);
        })
      )
      .subscribe(() => {
        this.fetchExpenses(this.selectedMonth, this.selectedYear);
        this.successMessage = 'Despesa cadastrada com sucesso'; 
        this.isSuccessModalOpen = true;
        this.closeNewExpenseModal();
      });
  }

  addNewGroupExpense() {
    const url = 'http://localhost:8080/grupo-gastos/cadastrar';
    this.http.post(url, this.newGroupExpense)
      .pipe(
        catchError(error => {
          console.error('Error adding expense:', error);
          this.errorMessage = error.error.message || 'Erro ao cadastrar o grupo';
          this.isErrorModalOpen = true;
          return throwError(error);
        })
      )
      .subscribe(() => {
        this.fetchExpenses(this.selectedMonth, this.selectedYear);
        this.successMessage = 'Grupo cadastrado com sucesso';
        this.isSuccessModalOpen = true;
        this.fetchGruposGastos();
      });
  }

  openEditModal(expense: Expense) {
    this.selectedExpense = { 
      ...expense, 
      grupoGastos: this.gruposGastos.find(g => g.id === expense.grupoGastos.id) || { id: 0, nome: '' } 
    };
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedExpense = null;
  }

  openNewExpenseModal() {
    this.isNewExpenseModalOpen = true;
  }

  closeNewExpenseModal() {
    this.isNewExpenseModalOpen = false;
    this.newExpense = { id: 0, nome: '', descricao: '', valor: 0, grupoGastos: {id: 0, nome: ''}, dataFim: null, dataInicio: '', parcela: '' };
  }
  openNewGroupExpenseModal() {
    this.isNewGroupExpenseModalOpen = true;
  }

  closeNewGroupExpenseModal() {
    this.isNewGroupExpenseModalOpen = false;
    this.newGroupExpense = { id: 0, nome: '' };
  }

  closeSuccessModal() {
    this.isSuccessModalOpen = false;
  }

  openErrorModal() {
    this.isErrorModalOpen = true;
  }
  
  closeErrorModal() {
    this.isErrorModalOpen = false;
    this.errorMessage = '';
  }
}