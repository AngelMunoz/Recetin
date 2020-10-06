import { PLATFORM, autoinject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator'
import { RouterConfiguration, Router } from 'aurelia-router';
import { FormRecipeValue } from 'components/recipe-form';
import { RecipeService, SaveRecipeProps } from 'services/recipes';
import { AppState, Events, Recipe } from 'types';
import UIkit from 'uikit';
import { Store } from 'aurelia-store';
import { ClipboardAction, ShareAction } from 'store';

@autoinject
export class App {
  private router: Router;
  private newRecipe: FormRecipeValue =
    {
      title: 'Mi Receta',
      description: '',
      ingredients: [],
      steps: []
    }
  private recipeTitleError = false;
  private preventSave = false;
  private importRecipe: SaveRecipeProps;

  constructor(private $recipes: RecipeService, private ea: EventAggregator, private store: Store<AppState>) {
    this.store.registerAction(ClipboardAction.type, ClipboardAction.action);
    this.store.registerAction(ShareAction.type, ShareAction.action);
  }

  trySaveRecipe(event: CustomEvent<FormRecipeValue> | FormRecipeValue) {
    this.preventSave = true;
    let recipe: FormRecipeValue;
    if (event instanceof CustomEvent) {
      recipe = { ...event.detail };
    } else {
      recipe = { ...event };
    }
    return this.$recipes.saveRecipe(recipe).then((_: Recipe) => {
      this.preventSave = false;
      this.newRecipe = {
        title: 'Mi Receta',
        description: '',
        ingredients: [],
        steps: []
      };
      UIkit.notification({
        message: `"${_.title}" ha sido guardada con exito`,
        status: 'success'
      });
      this.ea.publish(Events.CreatedRecipe, _);
    })
      .catch(console.error);
  }

  async checkClipboard(event: CustomEvent) {
    try {
      const importText = await navigator.clipboard.readText();
      this.importRecipe = this.$recipes.parse(importText);
      return true;
    } catch (error) {
      console.warn({ clipboardError: error });
    }
    return false;
  }

  async checkRecipeName(event: CustomEvent<string>) {
    try {
      const exists = await this.$recipes.recipeNameExists(event.detail);
      this.recipeTitleError = exists;
    } catch (error) {
      console.warn("appts:err:", { error });
    }
  }

  private checkCanShare(): Promise<boolean> {
    return Promise.resolve(!!navigator.share);
  }

  private checkCanClipboard(): Promise<boolean> {
    return Promise.resolve(!!(navigator.clipboard && navigator.clipboard.readText && navigator.clipboard.writeText));
  }

  private configureRouter(config: RouterConfiguration, router: Router): void {
    this.router = router;
    config.title = 'Recetin';
    config.map([
      { route: '', name: 'recipes', moduleId: PLATFORM.moduleName('./pages/recipes'), nav: true, title: 'Recetas' },
      { route: 'recipes/:recipeid', name: 'recipe', moduleId: PLATFORM.moduleName('./pages/recipe-detail'), nav: false, title: 'Receta' }
    ]);
  }

  private async activate() {
    const [canShare, canClipboard] = await Promise.allSettled([this.checkCanShare(), this.checkCanClipboard()]);

    if (canShare.status === 'fulfilled') {
      this.store.dispatch(ShareAction.type, canShare.value);
    } else {
      this.store.dispatch(ShareAction.type, false);
    }

    if (canClipboard.status === 'fulfilled') {
      this.store.dispatch(ClipboardAction.type, canClipboard.value);
    } else {
      this.store.dispatch(ClipboardAction.type, false);
    }

  }
}
